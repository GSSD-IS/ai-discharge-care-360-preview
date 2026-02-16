import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  CollaborationParticipantRole,
  IncidentSeverity,
} from '@prisma/client';

export class LinkLineAccountDto {
  @IsString()
  @IsNotEmpty()
  lineUserId!: string;

  @IsEnum(CollaborationParticipantRole)
  role!: CollaborationParticipantRole;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

export class ReportIncidentDto {
  @IsUUID()
  patientId!: string;

  @IsEnum(CollaborationParticipantRole)
  reporterRole!: CollaborationParticipantRole;

  @IsString()
  @IsNotEmpty()
  incidentType!: string;

  @IsEnum(IncidentSeverity)
  severity!: IncidentSeverity;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  rawPayload?: unknown;
}

export class CreateCollaborationTaskDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsString()
  @IsNotEmpty()
  externalOrgName!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

export class UpdateTaskStatusDto {
  @IsOptional()
  @IsString()
  note?: string;
}
