import {
  Body,
  Req,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { LineService } from './line.service';
import {
  CreateCollaborationTaskDto,
  LinkLineAccountDto,
  ReportIncidentDto,
  UpdateTaskStatusDto,
} from './dto/line.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentTenant } from '../auth/decorators/user.decorator';
import { UserRole } from '@prisma/client';

@Controller('line')
export class LineController {
  constructor(private readonly lineService: LineService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Headers('x-line-signature') signature: string,
    @Req() req: { rawBody?: Buffer },
    @Body() payload: unknown,
  ) {
    const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(payload ?? {});
    const valid = this.lineService.verifySignature(rawBody, signature);

    if (!valid) {
      throw new UnauthorizedException('Invalid LINE signature');
    }

    return this.lineService.handleWebhook(payload);
  }

  @Post('link')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.CASE_MANAGER)
  async link(
    @CurrentTenant() tenant: { id: string },
    @Body() dto: LinkLineAccountDto,
  ) {
    return this.lineService.linkLineAccount(tenant.id, dto);
  }

  @Post('tasks')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.CASE_MANAGER)
  async createTask(
    @CurrentTenant() tenant: { id: string },
    @Body() dto: CreateCollaborationTaskDto,
  ) {
    return this.lineService.createTask(tenant.id, dto);
  }

  @Get('tasks')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.CASE_MANAGER, UserRole.PHYSICIAN, UserRole.NURSE)
  async listTasks(
    @CurrentTenant() tenant: { id: string },
    @Query('status') status?: string,
  ) {
    return this.lineService.listTasks(tenant.id, status);
  }

  @Post('tasks/:taskId/accept')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.CASE_MANAGER)
  async acceptTask(
    @CurrentTenant() tenant: { id: string },
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.lineService.acceptTask(tenant.id, taskId, dto.note);
  }

  @Post('tasks/:taskId/complete')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.CASE_MANAGER)
  async completeTask(
    @CurrentTenant() tenant: { id: string },
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.lineService.completeTask(tenant.id, taskId, dto.note);
  }

  @Post('incidents')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.CASE_MANAGER, UserRole.PHYSICIAN, UserRole.NURSE)
  async reportIncident(
    @CurrentTenant() tenant: { id: string },
    @Body() dto: ReportIncidentDto,
  ) {
    return this.lineService.reportIncident(tenant.id, dto);
  }

  @Get('progress/:patientId')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.CASE_MANAGER, UserRole.PHYSICIAN, UserRole.NURSE)
  async progress(
    @CurrentTenant() tenant: { id: string },
    @Param('patientId') patientId: string,
  ) {
    return this.lineService.getProgressSummary(tenant.id, patientId);
  }

  @Get('timeline/:patientId')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.CASE_MANAGER, UserRole.PHYSICIAN, UserRole.NURSE)
  async timeline(
    @CurrentTenant() tenant: { id: string },
    @Param('patientId') patientId: string,
  ) {
    return this.lineService.getTimeline(tenant.id, patientId);
  }
}
