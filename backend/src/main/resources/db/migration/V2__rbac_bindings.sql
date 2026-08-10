-- Liaison rôles ↔ permissions (least privilege de base)

-- ADMIN : tout
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

-- RESPONSABLE_SECURITE
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN (
    'SECURITY_VIEW', 'SECURITY_MANAGE', 'INCIDENT_MANAGE', 'AUDIT_VIEW', 'DATA_READ'
)
WHERE r.code = 'RESPONSABLE_SECURITE'
ON CONFLICT DO NOTHING;

-- RESPONSABLE
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN (
    'DATA_READ', 'DATA_WRITE', 'DATA_EXPORT', 'DATA_SHARE', 'USER_MANAGE', 'SECURITY_VIEW', 'AUDIT_VIEW'
)
WHERE r.code = 'RESPONSABLE'
ON CONFLICT DO NOTHING;

-- AGRONOME / TECHNICIEN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN ('DATA_READ', 'DATA_WRITE', 'DATA_EXPORT', 'SECURITY_VIEW')
WHERE r.code IN ('AGRONOME', 'TECHNICIEN')
ON CONFLICT DO NOTHING;

-- PRODUCTEUR
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN ('DATA_READ', 'DATA_WRITE', 'SECURITY_VIEW')
WHERE r.code = 'PRODUCTEUR'
ON CONFLICT DO NOTHING;
