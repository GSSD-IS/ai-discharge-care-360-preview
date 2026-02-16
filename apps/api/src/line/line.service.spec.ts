import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { LineService } from './line.service';

describe('LineService', () => {
  const prismaMock = {
    lineAccount: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    collaborationEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    collaborationTask: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    patient: {
      findFirst: jest.fn(),
    },
    incidentReport: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  let service: LineService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LineService(prismaMock as any);
  });

  describe('verifySignature', () => {
    it('returns true for valid signature', () => {
      process.env.LINE_CHANNEL_SECRET = 'test_secret';
      const rawBody = JSON.stringify({ events: [] });
      const signature = crypto
        .createHmac('sha256', process.env.LINE_CHANNEL_SECRET)
        .update(rawBody)
        .digest('base64');

      expect(service.verifySignature(rawBody, signature)).toBe(true);
    });

    it('returns false when signature does not match', () => {
      process.env.LINE_CHANNEL_SECRET = 'test_secret';
      const rawBody = JSON.stringify({ events: [] });

      expect(service.verifySignature(rawBody, 'invalid_signature')).toBe(false);
    });
  });

  describe('handleWebhook', () => {
    it('persists only linked account events', async () => {
      prismaMock.lineAccount.findFirst
        .mockResolvedValueOnce({
          tenantId: 'tenant-1',
          patientId: 'patient-1',
          role: 'FAMILY',
        })
        .mockResolvedValueOnce(null);

      const result = await service.handleWebhook({
        events: [
          {
            type: 'message',
            timestamp: 123,
            source: { userId: 'line-user-1', type: 'user' },
            message: { text: 'hello\nworld', type: 'text' },
          },
          {
            type: 'follow',
            source: { userId: 'line-user-2' },
          },
        ],
      });

      expect(prismaMock.collaborationEvent.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.collaborationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payload: expect.objectContaining({
              messagePreview: 'hello world',
              sourceType: 'user',
            }),
          }),
        }),
      );
      expect(result).toEqual({ received: 2, persisted: 1, skipped: 1 });
    });
  });

  describe('linkLineAccount', () => {
    it('throws when patientId is not in current tenant', async () => {
      prismaMock.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.linkLineAccount('tenant-1', {
          lineUserId: 'line-user-1',
          role: 'FAMILY' as any,
          patientId: 'not-found-patient',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('task operations', () => {
    it('creates task and emits TASK_CREATED event', async () => {
      prismaMock.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
      prismaMock.collaborationTask.create.mockResolvedValue({
        id: 'task-1',
        patientId: 'patient-1',
        title: '交通安排',
        externalOrgName: '外部A單位',
        dueAt: null,
      });

      const result = await service.createTask('tenant-1', {
        patientId: 'patient-1',
        title: '交通安排',
        externalOrgName: '外部A單位',
      });

      expect(result.id).toBe('task-1');
      expect(prismaMock.collaborationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ eventType: 'TASK_CREATED' }) }),
      );
    });

    it('accepts and completes task', async () => {
      prismaMock.collaborationTask.findFirst.mockResolvedValue({ id: 'task-1', tenantId: 'tenant-1', patientId: 'patient-1' });
      prismaMock.collaborationTask.update
        .mockResolvedValueOnce({ id: 'task-1', patientId: 'patient-1' })
        .mockResolvedValueOnce({ id: 'task-1', patientId: 'patient-1' });

      await service.acceptTask('tenant-1', 'task-1', '已接案');
      await service.completeTask('tenant-1', 'task-1', '已完成服務');

      expect(prismaMock.collaborationTask.update).toHaveBeenCalledTimes(2);
      expect(prismaMock.collaborationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ eventType: 'TASK_ACCEPTED' }) }),
      );
      expect(prismaMock.collaborationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ eventType: 'TASK_COMPLETED' }) }),
      );
    });
  });

  describe('getProgressSummary', () => {
    it('returns progress + privacy care + security notice when risk is high', async () => {
      prismaMock.patient.findFirst.mockResolvedValue({
        id: 'patient-1',
        name: '王小明',
        currentStatusNodeId: 'S2_PLAN',
        dischargeDate: null,
      });
      prismaMock.incidentReport.findMany.mockResolvedValue([{ severity: 'HIGH' }]);
      prismaMock.collaborationEvent.findMany.mockResolvedValue([
        { id: 'evt-1', eventType: 'LINE_MESSAGE', createdAt: new Date() },
      ]);

      const result = await service.getProgressSummary('tenant-1', 'patient-1');

      expect(result.progress.stageKey).toBe('S2');
      expect(result.nextStep).toContain('資源銜接');
      expect(result.alerts.hasCriticalIncident).toBe(true);
      expect(result.careMessage).toContain('較高風險警示');
      expect(result.privacyCare.privacyFocus).toContain('高風險期間');
      expect(result.securityNotice.privacy).toContain('必要摘要');
    });
  });
});
