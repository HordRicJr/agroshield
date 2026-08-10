-- AgroShield AI — schéma cœur multi-tenant (Phase 2)
-- ddl-auto=validate : Flyway est la seule source de vérité schéma.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========== IAM / multi-tenant ==========

CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(128) NOT NULL UNIQUE,
    status          VARCHAR(32)  NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(320) NOT NULL,
    phone_e164          VARCHAR(32),
    password_hash       VARCHAR(512) NOT NULL,
    full_name           VARCHAR(255) NOT NULL,
    status              VARCHAR(32)  NOT NULL DEFAULT 'ACTIVE',
    mfa_enabled         BOOLEAN      NOT NULL DEFAULT FALSE,
    password_changed_at TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(64)  NOT NULL UNIQUE,
    name        VARCHAR(128) NOT NULL,
    description VARCHAR(512)
);

CREATE TABLE permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(64)  NOT NULL UNIQUE,
    description VARCHAR(512)
);

CREATE TABLE role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE organization_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES roles(id),
    status          VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_org_member UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Refresh tokens : stocker UNIQUEMENT le hash (SHA-256), jamais le token clair
CREATE TABLE sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id     UUID REFERENCES organizations(id) ON DELETE SET NULL,
    refresh_token_hash  VARCHAR(64) NOT NULL UNIQUE,
    user_agent_hash     VARCHAR(64),
    ip_hash             VARCHAR(64),
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);

-- ========== Agricole (minimal Phase 2) ==========

CREATE TABLE producers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code            VARCHAR(64) NOT NULL,
    display_name    VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_producer_org_code UNIQUE (organization_id, code)
);

CREATE TABLE farms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    producer_id     UUID REFERENCES producers(id) ON DELETE SET NULL,
    name            VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_farms_org ON farms(organization_id);

CREATE TABLE file_metadata (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    uploaded_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    original_name    VARCHAR(512) NOT NULL,
    stored_name      VARCHAR(512) NOT NULL,
    content_type     VARCHAR(128),
    size_bytes       BIGINT NOT NULL,
    sha256_hex       VARCHAR(64) NOT NULL,
    storage_path     VARCHAR(1024) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_file_meta_org ON file_metadata(organization_id);
CREATE INDEX idx_file_meta_hash ON file_metadata(sha256_hex);

CREATE TABLE data_classifications (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    file_id              UUID REFERENCES file_metadata(id) ON DELETE SET NULL,
    column_name          VARCHAR(256) NOT NULL,
    classification       VARCHAR(64) NOT NULL,
    risk_level           VARCHAR(32) NOT NULL,
    confidence           NUMERIC(5,4),
    method               VARCHAR(16),
    recommended_policy   JSONB,
    human_validated      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_data_class_org ON data_classifications(organization_id);

-- ========== Sécurité / IA / audit ==========

CREATE TABLE security_events (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type       VARCHAR(64) NOT NULL,
    resource_type    VARCHAR(64),
    resource_id      VARCHAR(128),
    payload_json     JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sec_events_org_time ON security_events(organization_id, created_at DESC);

CREATE TABLE ai_predictions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    prediction_type  VARCHAR(64) NOT NULL,
    model_name       VARCHAR(255) NOT NULL,
    model_version    VARCHAR(128),
    input_hash       VARCHAR(64) NOT NULL,
    score            NUMERIC(8,4),
    confidence       NUMERIC(5,4),
    risk_level       VARCHAR(32),
    result_json      JSONB NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_pred_org_time ON ai_predictions(organization_id, created_at DESC);
CREATE INDEX idx_ai_pred_input_hash ON ai_predictions(input_hash);

CREATE TABLE risk_assessments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    source           VARCHAR(64) NOT NULL,
    risk_score       INT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    risk_level       VARCHAR(32) NOT NULL,
    ai_prediction_id UUID REFERENCES ai_predictions(id) ON DELETE SET NULL,
    explanation      TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE risk_factors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_assessment_id  UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
    factor              VARCHAR(128) NOT NULL,
    description         VARCHAR(512) NOT NULL,
    weight              INT NOT NULL,
    source              VARCHAR(32) NOT NULL
);

CREATE INDEX idx_risk_factors_assessment ON risk_factors(risk_assessment_id);

CREATE TABLE incidents (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type             VARCHAR(64) NOT NULL,
    severity         VARCHAR(32) NOT NULL,
    status           VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    detected_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at      TIMESTAMPTZ,
    assigned_to      UUID REFERENCES users(id) ON DELETE SET NULL,
    description      TEXT,
    risk_score       INT,
    source           VARCHAR(64),
    metadata_json    JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incidents_org_status ON incidents(organization_id, status);

CREATE TABLE alerts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    incident_id      UUID REFERENCES incidents(id) ON DELETE SET NULL,
    level            VARCHAR(32) NOT NULL,
    message          VARCHAR(1024) NOT NULL,
    acknowledged_at  TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE security_policies (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code             VARCHAR(64) NOT NULL,
    action           VARCHAR(64) NOT NULL,
    config_json      JSONB NOT NULL DEFAULT '{}',
    enabled          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_policy_org_code UNIQUE (organization_id, code)
);

-- Append-only du point de vue applicatif (pas de UPDATE/DELETE métier)
CREATE TABLE audit_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    action           VARCHAR(64) NOT NULL,
    resource_type    VARCHAR(64),
    resource_id      VARCHAR(128),
    result           VARCHAR(32) NOT NULL,
    risk_score       INT,
    risk_level       VARCHAR(32),
    ip_hash          VARCHAR(64),
    user_agent_hash  VARCHAR(64),
    metadata_json    JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_org_time ON audit_logs(organization_id, created_at DESC);

CREATE TABLE training_modules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(64) NOT NULL UNIQUE,
    title       VARCHAR(255) NOT NULL,
    topic       VARCHAR(128) NOT NULL,
    content_url VARCHAR(1024),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE training_results (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id        UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    score            INT,
    completed_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== Seed RBAC (codes stables) ==========

INSERT INTO roles (id, code, name, description) VALUES
    (gen_random_uuid(), 'PRODUCTEUR', 'Producteur', 'Accès producteur'),
    (gen_random_uuid(), 'TECHNICIEN', 'Technicien', 'Accès technicien'),
    (gen_random_uuid(), 'AGRONOME', 'Agronome', 'Accès agronome'),
    (gen_random_uuid(), 'RESPONSABLE', 'Responsable', 'Responsable organisation'),
    (gen_random_uuid(), 'RESPONSABLE_SECURITE', 'Responsable sécurité', 'Sécurité org'),
    (gen_random_uuid(), 'ADMIN', 'Administrateur', 'Administration plateforme');

INSERT INTO permissions (id, code, description) VALUES
    (gen_random_uuid(), 'DATA_READ', 'Lire des données'),
    (gen_random_uuid(), 'DATA_WRITE', 'Écrire des données'),
    (gen_random_uuid(), 'DATA_EXPORT', 'Exporter des données'),
    (gen_random_uuid(), 'DATA_DELETE', 'Supprimer des données'),
    (gen_random_uuid(), 'DATA_SHARE', 'Partager des données'),
    (gen_random_uuid(), 'USER_MANAGE', 'Gérer les utilisateurs'),
    (gen_random_uuid(), 'SECURITY_VIEW', 'Voir le tableau de bord sécurité'),
    (gen_random_uuid(), 'SECURITY_MANAGE', 'Gérer politiques et alertes'),
    (gen_random_uuid(), 'INCIDENT_MANAGE', 'Gérer les incidents'),
    (gen_random_uuid(), 'AUDIT_VIEW', 'Consulter les audit logs');
