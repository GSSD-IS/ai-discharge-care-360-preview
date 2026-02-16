import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCollaborationTaskDto,
  LinkLineAccountDto,
  ReportIncidentDto,
} from './dto/line.dto';
import * as crypto from 'crypto';

export interface ProgressGuidance {
  stageKey: string;
  stageLabel: string;
  nextStep: string;
  careMessage: string;
}

export interface PrivacyCareGuidance {
  privacyFocus: string;
  safeActions: string[];
  avoidActions: string[];
}

@Injectable()
export class LineService {
  constructor(private readonly prisma: PrismaService) {}

  verifySignature(rawBody: string, signature?: string): boolean {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;

    if (!channelSecret || !signature) {
      return false;
    }

    const expected = crypto
      .createHmac('sha256', channelSecret)
      .update(rawBody)
      .digest('base64');

    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  }

  private sanitizeText(text: string, maxLength = 120): string {
    return text.replace(/[\r\n\t]+/g, ' ').trim().slice(0, maxLength);
  }

  private summarizeEventPayload(event: Record<string, unknown>, lineUserId: string) {
    const source = (event.source ?? {}) as Record<string, unknown>;
    const message = (event.message ?? {}) as Record<string, unknown>;
    const postback = (event.postback ?? {}) as Record<string, unknown>;

    const messageText = typeof message.text === 'string' ? message.text : '';

    return {
      lineUserId,
      sourceType: typeof source.type === 'string' ? source.type : null,
      timestamp: typeof event.timestamp === 'number' ? event.timestamp : null,
      messageType: typeof message.type === 'string' ? message.type : null,
      messagePreview: messageText ? this.sanitizeText(messageText) : null,
      postbackData:
        typeof postback.data === 'string' ? this.sanitizeText(postback.data, 80) : null,
    };
  }

  async handleWebhook(payload: unknown) {
    const body = payload as { events?: Array<Record<string, unknown>> };
    const events = body?.events ?? [];

    let persisted = 0;
    let skipped = 0;

    for (const event of events) {
      const source = (event.source ?? {}) as Record<string, unknown>;
      const lineUserId = typeof source.userId === 'string' ? source.userId : null;
      const eventType = typeof event.type === 'string' ? event.type : 'unknown';

      if (!lineUserId) {
        skipped += 1;
        continue;
      }

      const account = await this.prisma.lineAccount.findFirst({
        where: {
          lineUserId,
          unlinkedAt: null,
        },
        orderBy: {
          linkedAt: 'desc',
        },
      });

      if (!account) {
        skipped += 1;
        continue;
      }

      await this.prisma.collaborationEvent.create({
        data: {
          tenantId: account.tenantId,
          patientId: account.patientId,
          actorRole: account.role,
          eventType: `LINE_${eventType.toUpperCase()}`,
          payload: this.summarizeEventPayload(event, lineUserId),
        },
      });
      persisted += 1;
    }

    return { received: events.length, persisted, skipped };
  }

  async linkLineAccount(tenantId: string, dto: LinkLineAccountDto) {
    const patientId = dto.patientId ?? null;

    if (dto.role === 'PATIENT' && !patientId) {
      throw new UnauthorizedException('PATIENT 綁定需提供 patientId');
    }

    if (patientId) {
      const patient = await this.prisma.patient.findFirst({
        where: { id: patientId, tenantId },
      });
      if (!patient) {
        throw new BadRequestException('patientId 不存在或不屬於當前租戶');
      }
    }

    return this.prisma.lineAccount.upsert({
      where: {
        tenantId_lineUserId: {
          tenantId,
          lineUserId: dto.lineUserId,
        },
      },
      create: {
        tenantId,
        lineUserId: dto.lineUserId,
        role: dto.role,
        patientId,
        displayName: dto.displayName,
      },
      update: {
        role: dto.role,
        patientId,
        displayName: dto.displayName,
        unlinkedAt: null,
      },
    });
  }

  async reportIncident(tenantId: string, dto: ReportIncidentDto) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId },
    });
    if (!patient) {
      throw new BadRequestException('patientId 不存在或不屬於當前租戶');
    }

    const rawPayload =
      dto.rawPayload === undefined
        ? undefined
        : JSON.parse(JSON.stringify(dto.rawPayload));

    const incident = await this.prisma.incidentReport.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        reporterRole: dto.reporterRole,
        incidentType: dto.incidentType,
        severity: dto.severity,
        description: dto.description,
        rawPayload,
      },
    });

    await this.prisma.collaborationEvent.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        actorRole: dto.reporterRole,
        eventType: 'LINE_INCIDENT_REPORTED',
        payload: {
          incidentId: incident.id,
          incidentType: dto.incidentType,
          severity: dto.severity,
          description: dto.description,
        },
      },
    });

    return incident;
  }

  private deriveProgressGuidance(currentStatusNodeId?: string | null): ProgressGuidance {
    const node = (currentStatusNodeId ?? '').toUpperCase();

    if (node.startsWith('S0') || node.includes('SCREEN')) {
      return {
        stageKey: 'S0',
        stageLabel: '篩檢中',
        nextStep: '完成高風險篩檢與收案確認。',
        careMessage: '我們已開始關注您的狀況，接下來會由個管師與您確認需求。',
      };
    }

    if (node.startsWith('S1') || node.includes('ASSESS')) {
      return {
        stageKey: 'S1',
        stageLabel: '跨團隊評估',
        nextStep: '請協助完成評估問卷與照護資訊確認。',
        careMessage: '團隊正在整合您的照護重點，謝謝您與家屬配合提供資訊。',
      };
    }

    if (node.startsWith('S2') || node.includes('PLAN')) {
      return {
        stageKey: 'S2',
        stageLabel: '出院計畫擬定',
        nextStep: '確認出院後服務與資源銜接時程。',
        careMessage: '我們會與家屬一起確認出院後安排，讓返家或轉銜更安心。',
      };
    }

    if (node.startsWith('S3') || node.includes('EDU')) {
      return {
        stageKey: 'S3',
        stageLabel: '衛教與準備',
        nextStep: '完成衛教內容閱讀與重點回覆。',
        careMessage: '請放心，我們會一步步陪您完成返家前的必要準備。',
      };
    }

    if (node.startsWith('S4') || node.includes('TRACK')) {
      return {
        stageKey: 'S4',
        stageLabel: '出院後追蹤',
        nextStep: '依提醒回報每日狀況，若不舒服請立即通報。',
        careMessage: '您不是一個人，出院後我們仍會持續關心您的恢復進度。',
      };
    }

    return {
      stageKey: 'UNKNOWN',
      stageLabel: '照護流程進行中',
      nextStep: '請留意 LINE 通知並配合回覆。',
      careMessage: '我們持續關心您的狀況，若有任何不適請立即告知。',
    };
  }

  private derivePrivacyCareGuidance(
    hasCriticalIncident: boolean,
  ): PrivacyCareGuidance {
    if (hasCriticalIncident) {
      return {
        privacyFocus: '高風險期間請只用最小必要資訊回報症狀，避免公開敏感病史。',
        safeActions: ['僅回覆系統指定欄位', '使用院方驗證連結', '異常時直接聯絡照護團隊'],
        avoidActions: ['上傳完整病歷影像', '傳送身分證字號', '點擊來源不明連結'],
      };
    }

    return {
      privacyFocus: '日常回報以必要摘要為主，保護個資與醫療隱私。',
      safeActions: ['回報症狀摘要與量測結果', '使用官方 LINE 帳號互動', '發現異常帳號立即通報'],
      avoidActions: ['公開群組張貼病歷', '分享醫囑截圖給不相關對象', '傳送完整個資欄位'],
    };
  }



  async createTask(tenantId: string, dto: CreateCollaborationTaskDto) {
    if (dto.patientId) {
      const patient = await this.prisma.patient.findFirst({
        where: { id: dto.patientId, tenantId },
      });
      if (!patient) {
        throw new BadRequestException('patientId 不存在或不屬於當前租戶');
      }
    }

    const task = await this.prisma.collaborationTask.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        externalOrgName: this.sanitizeText(dto.externalOrgName, 80),
        title: this.sanitizeText(dto.title, 120),
        description: dto.description ? this.sanitizeText(dto.description, 500) : undefined,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      },
    });

    await this.prisma.collaborationEvent.create({
      data: {
        tenantId,
        patientId: task.patientId,
        taskId: task.id,
        actorRole: 'CASE_MANAGER',
        eventType: 'TASK_CREATED',
        payload: {
          title: task.title,
          externalOrgName: task.externalOrgName,
          dueAt: task.dueAt,
        },
      },
    });

    return task;
  }

  async listTasks(tenantId: string, status?: string) {
    return this.prisma.collaborationTask.findMany({
      where: {
        tenantId,
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async acceptTask(tenantId: string, taskId: string, note?: string) {
    const task = await this.prisma.collaborationTask.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!task) {
      throw new BadRequestException('task 不存在或不屬於當前租戶');
    }

    const updated = await this.prisma.collaborationTask.update({
      where: { id: taskId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    await this.prisma.collaborationEvent.create({
      data: {
        tenantId,
        patientId: updated.patientId,
        taskId: updated.id,
        actorRole: 'AGENCY_MEMBER',
        eventType: 'TASK_ACCEPTED',
        payload: {
          note: note ? this.sanitizeText(note, 200) : null,
        },
      },
    });

    return updated;
  }

  async completeTask(tenantId: string, taskId: string, note?: string) {
    const task = await this.prisma.collaborationTask.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!task) {
      throw new BadRequestException('task 不存在或不屬於當前租戶');
    }

    const updated = await this.prisma.collaborationTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    await this.prisma.collaborationEvent.create({
      data: {
        tenantId,
        patientId: updated.patientId,
        taskId: updated.id,
        actorRole: 'AGENCY_MEMBER',
        eventType: 'TASK_COMPLETED',
        payload: {
          note: note ? this.sanitizeText(note, 200) : null,
        },
      },
    });

    return updated;
  }
  async getTimeline(tenantId: string, patientId: string) {
    return this.prisma.collaborationEvent.findMany({
      where: {
        tenantId,
        patientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }

  async getProgressSummary(tenantId: string, patientId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
      select: {
        id: true,
        name: true,
        currentStatusNodeId: true,
        dischargeDate: true,
      },
    });

    if (!patient) {
      throw new BadRequestException('patientId 不存在或不屬於當前租戶');
    }

    const guidance = this.deriveProgressGuidance(patient.currentStatusNodeId);

    const [recentIncidents, lastEvents] = await Promise.all([
      this.prisma.incidentReport.findMany({
        where: { tenantId, patientId },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      this.prisma.collaborationEvent.findMany({
        where: { tenantId, patientId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          eventType: true,
          createdAt: true,
        },
      }),
    ]);

    const hasCriticalIncident = recentIncidents.some(
      (i) => i.severity === 'CRITICAL' || i.severity === 'HIGH',
    );

    const privacyCare = this.derivePrivacyCareGuidance(hasCriticalIncident);

    return {
      patient: {
        id: patient.id,
        name: patient.name,
      },
      progress: {
        stageKey: guidance.stageKey,
        stageLabel: guidance.stageLabel,
        currentStatusNodeId: patient.currentStatusNodeId,
        dischargeDate: patient.dischargeDate,
      },
      nextStep: guidance.nextStep,
      careMessage: hasCriticalIncident
        ? '我們已收到較高風險警示，團隊會優先與您聯繫，請保持電話暢通。'
        : guidance.careMessage,
      privacyCare,
      securityNotice: {
        privacy: '為保護隱私，LINE 僅顯示必要摘要，不會傳送完整病歷。',
        intrusionPrevention:
          '請勿在 LINE 傳送身分證號或完整病歷影像；若收到可疑連結請勿點擊並立即通報。',
      },
      alerts: {
        hasCriticalIncident,
        recentIncidentCount: recentIncidents.length,
      },
      recentEvents: lastEvents,
    };
  }
}
