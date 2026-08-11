-- CyberÉducation — catalogue initial de modules de sensibilisation (démo).
INSERT INTO training_modules (id, code, title, topic, content_url) VALUES
    (gen_random_uuid(), 'PHISHING-101', 'Reconnaître une tentative de phishing', 'phishing', NULL),
    (gen_random_uuid(), 'MDP-101', 'Bonnes pratiques de mots de passe', 'authentification', NULL),
    (gen_random_uuid(), 'DONNEES-101', 'Protéger les données agricoles et financières', 'protection-donnees', NULL),
    (gen_random_uuid(), 'PARTAGE-101', 'Partager une donnée sans exposer tout un fichier', 'partage-securise', NULL)
ON CONFLICT (code) DO NOTHING;
