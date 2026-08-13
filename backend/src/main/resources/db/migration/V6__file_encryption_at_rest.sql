-- File encryption at-rest metadata
ALTER TABLE file_metadata
    ADD COLUMN IF NOT EXISTS encrypted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS encryption_alg VARCHAR(32),
    ADD COLUMN IF NOT EXISTS iv_b64 VARCHAR(64),
    ADD COLUMN IF NOT EXISTS key_id VARCHAR(64);

COMMENT ON COLUMN file_metadata.encrypted IS 'True when bytes on disk are AES-GCM ciphertext';
COMMENT ON COLUMN file_metadata.iv_b64 IS 'Base64 IV for AES-GCM (12 bytes)';
COMMENT ON COLUMN file_metadata.key_id IS 'Logical key id for future rotation';
