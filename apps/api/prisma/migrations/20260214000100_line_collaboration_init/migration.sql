-- LINE collaboration tables for Supabase Postgres

DO $$ BEGIN
  CREATE TYPE "CollaborationParticipantRole" AS ENUM (
    'PATIENT',
    'FAMILY',
    'AGENCY_MEMBER',
    'CASE_MANAGER',
    'PHYSICIAN',
    'NURSE',
    'SYSTEM_BOT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CollaborationTaskStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'IN_PROGRESS',
    'COMPLETED',
    'REJECTED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "IncidentSeverity" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "line_accounts" (
  "id" TEXT PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "patient_id" TEXT,
  "role" "CollaborationParticipantRole" NOT NULL,
  "display_name" TEXT,
  "line_user_id" TEXT NOT NULL,
  "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unlinked_at" TIMESTAMP(3),
  CONSTRAINT "line_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "line_accounts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "collaboration_tasks" (
  "id" TEXT PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "patient_id" TEXT,
  "external_org_name" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "CollaborationTaskStatus" NOT NULL DEFAULT 'PENDING',
  "due_at" TIMESTAMP(3),
  "accepted_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "collaboration_tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "collaboration_tasks_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "collaboration_events" (
  "id" TEXT PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "patient_id" TEXT,
  "task_id" TEXT,
  "actor_role" "CollaborationParticipantRole" NOT NULL,
  "event_type" TEXT NOT NULL,
  "payload" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "collaboration_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "collaboration_events_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "collaboration_events_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "collaboration_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "incident_reports" (
  "id" TEXT PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "patient_id" TEXT NOT NULL,
  "reporter_role" "CollaborationParticipantRole" NOT NULL,
  "incident_type" TEXT NOT NULL,
  "severity" "IncidentSeverity" NOT NULL,
  "description" TEXT,
  "source" TEXT NOT NULL DEFAULT 'LINE',
  "raw_payload" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "incident_reports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "incident_reports_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "line_accounts_tenant_id_line_user_id_key" ON "line_accounts"("tenant_id", "line_user_id");
CREATE INDEX IF NOT EXISTS "line_accounts_tenant_id_patient_id_idx" ON "line_accounts"("tenant_id", "patient_id");
CREATE INDEX IF NOT EXISTS "collaboration_tasks_tenant_id_status_idx" ON "collaboration_tasks"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "collaboration_tasks_tenant_id_patient_id_idx" ON "collaboration_tasks"("tenant_id", "patient_id");
CREATE INDEX IF NOT EXISTS "collaboration_events_tenant_id_patient_id_created_at_idx" ON "collaboration_events"("tenant_id", "patient_id", "created_at");
CREATE INDEX IF NOT EXISTS "collaboration_events_tenant_id_event_type_idx" ON "collaboration_events"("tenant_id", "event_type");
CREATE INDEX IF NOT EXISTS "incident_reports_tenant_id_patient_id_severity_idx" ON "incident_reports"("tenant_id", "patient_id", "severity");
