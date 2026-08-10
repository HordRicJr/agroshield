-- Hash email dédié pour les événements pré-auth (ne pas réutiliser user_agent_hash).
ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS email_hash VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_audit_email_hash ON audit_logs(email_hash)
    WHERE email_hash IS NOT NULL;
