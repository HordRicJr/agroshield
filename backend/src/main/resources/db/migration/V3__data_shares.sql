-- Partage sélectif : accès métadonnées / colonnes autorisées — jamais le fichier complet par défaut.
CREATE TABLE data_shares (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
    file_id          UUID NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
    token_hash       VARCHAR(64) NOT NULL,
    label            VARCHAR(255),
    allowed_columns  JSONB NOT NULL DEFAULT '[]',
    expires_at       TIMESTAMPTZ NOT NULL,
    revoked_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_data_share_token_hash UNIQUE (token_hash)
);

CREATE INDEX idx_data_shares_org ON data_shares(organization_id);
CREATE INDEX idx_data_shares_file ON data_shares(file_id);
