-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT');

-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "token_version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "project_images" ADD COLUMN     "height" INTEGER,
ADD COLUMN     "width" INTEGER;

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "changes" JSONB,
    "admin_id" UUID,
    "actor_email" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_created_at_id_idx" ON "audit_logs"("created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_admin_id_idx" ON "audit_logs"("admin_id");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Trilha de auditoria append-only (adicionado manualmente).
-- Bloqueia DELETE e qualquer UPDATE, exceto o ON DELETE SET NULL da FK de admin_id.
-- Retenção/expurgo é tarefa de DBA: exige `ALTER TABLE audit_logs DISABLE TRIGGER audit_logs_append_only`.
CREATE FUNCTION audit_logs_append_only() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'audit_logs é append-only: DELETE não permitido';
  END IF;

  IF NEW.admin_id IS NOT NULL
     OR (NEW.id, NEW.action, NEW.entity, NEW.entity_id, NEW.changes, NEW.actor_email,
         NEW.ip, NEW.user_agent, NEW.request_id, NEW.created_at)
        IS DISTINCT FROM
        (OLD.id, OLD.action, OLD.entity, OLD.entity_id, OLD.changes, OLD.actor_email,
         OLD.ip, OLD.user_agent, OLD.request_id, OLD.created_at)
  THEN
    RAISE EXCEPTION 'audit_logs é append-only: UPDATE não permitido';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_append_only
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION audit_logs_append_only();
