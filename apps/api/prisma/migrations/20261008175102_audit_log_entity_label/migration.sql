-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "entity_label" TEXT;

-- Inclui entity_label na proteção append-only (adicionado manualmente).
CREATE OR REPLACE FUNCTION audit_logs_append_only() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'audit_logs é append-only: DELETE não permitido';
  END IF;

  IF NEW.admin_id IS NOT NULL
     OR (NEW.id, NEW.action, NEW.entity, NEW.entity_id, NEW.entity_label, NEW.changes,
         NEW.actor_email, NEW.ip, NEW.user_agent, NEW.request_id, NEW.created_at)
        IS DISTINCT FROM
        (OLD.id, OLD.action, OLD.entity, OLD.entity_id, OLD.entity_label, OLD.changes,
         OLD.actor_email, OLD.ip, OLD.user_agent, OLD.request_id, OLD.created_at)
  THEN
    RAISE EXCEPTION 'audit_logs é append-only: UPDATE não permitido';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
