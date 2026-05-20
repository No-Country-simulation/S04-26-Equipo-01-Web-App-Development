-- QUERY para obtener datos REALES de candidatos (talentos) de la base de datos

-- 1. Obtener perfiles de talentos con sus datos básicos
SELECT 
    p.id,
    p."fullName" as name,
    p.headline as title,
    u.email,
    p.location,
    p."professionalBio" as summary,
    p."employabilityScore",
    u.role
FROM profiles p
INNER JOIN "user" u ON p."userId" = u.id
WHERE u.role = 'TALENT'
ORDER BY p."fullName"
LIMIT 10;

-- 2. Obtener skills de cada candidato
SELECT 
    p."fullName" as candidate_name,
    us.id as skill_id,
    us.name as skill_name,
    us.category as skill_category,
    us.level as skill_level
FROM profiles p
INNER JOIN "user_skill" us ON p.id = us."profileId"
INNER JOIN "user" u ON p."userId" = u.id
WHERE u.role = 'TALENT'
ORDER BY p."fullName", us.name;

-- 3. Obtener resultados de pruebas técnicas
SELECT 
    p."fullName" as candidate_name,
    a.type,
    atr.score,
    atr."completedAt",
    atr.feedback
FROM profiles p
INNER JOIN assessment a ON p.id = a."profileId"
INNER JOIN assessment_test_result atr ON a.id = atr."assessmentId"
INNER JOIN "user" u ON p."userId" = u.id
WHERE u.role = 'TALENT' AND a.type = 'TECHNICAL'
ORDER BY p."fullName", atr."completedAt" DESC;

-- 4. Obtener resultados de pruebas psicotécnicas
SELECT 
    p."fullName" as candidate_name,
    a.type,
    atr.score,
    atr."completedAt",
    atr.feedback
FROM profiles p
INNER JOIN assessment a ON p.id = a."profileId"
INNER JOIN assessment_test_result atr ON a.id = atr."assessmentId"
INNER JOIN "user" u ON p."userId" = u.id
WHERE u.role = 'TALENT' AND a.type = 'PSYCHOTECHNICAL'
ORDER BY p."fullName", atr."completedAt" DESC;

-- 5. Obtener cursos de talentos
SELECT 
    p."fullName" as candidate_name,
    c.title as course_name,
    c.status,
    c.progress,
    c."startedAt"
FROM profiles p
INNER JOIN "learning_path" lp ON p.id = lp."profileId"
INNER JOIN course c ON lp.id = c."learningPathId"
INNER JOIN "user" u ON p."userId" = u.id
WHERE u.role = 'TALENT'
ORDER BY p."fullName", c.title;

-- 6. Cuántos talentos hay en total
SELECT COUNT(*) as total_talents FROM profiles p
INNER JOIN "user" u ON p."userId" = u.id
WHERE u.role = 'TALENT';
