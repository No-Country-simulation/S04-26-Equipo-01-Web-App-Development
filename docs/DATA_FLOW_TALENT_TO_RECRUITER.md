# Data Flow: Talent → Recruiter Dashboard

## Overview
Esta es la validación del flujo completo: lo que el **talento crea** en su dashboard debe ser visible al **reclutador** en el dashboard corporativo.

---

## 1. TALENT DASHBOARD (Creación de Datos)

### Donde el Talento Crea Sus Datos:

#### 📋 CV y Perfil
- **Ubicación**: TalentDashboard → "MI CV PROFESIONAL" → "Cargar Nuevo CV"
- **Endpoint usado**: `POST /profiles/me/cv/diagnostics`
- **Datos guardados**:
  - Perfil: nombre, email, teléfono, ubicación
  - Experiencia laboral
  - Educación
  - Skills técnicas y personales
  - Resumen profesional

#### 🎯 Skills Validadas
- **Ubicación**: TalentDashboard → "SKILLS" → "Editar Skills"
- **Endpoints usados**:
  - `POST /skills/me` (crear skill)
  - `PATCH /skills/me/{skillId}` (actualizar skill)
- **Datos guardados**:
  - Nombre del skill
  - Categoría (TECHNICAL o PERSONAL)
  - Nivel (1-5)
  - Años de experiencia (opcional)

#### ✅ Pruebas Técnicas y Psicotécnicas
- **Ubicación**: TalentDashboard → "EVALUACION PERFIL" → "Tecnica", "Psicotecnica"
- **Endpoints usados**:
  - `POST /assessments/me/generate-tests`
  - `POST /assessments/me/technical-tests/submit`
  - `POST /assessments/me/psychotechnical-tests/submit`
- **Datos guardados**:
  - Tipo de prueba (technical o psychotechnical)
  - Score obtenido
  - Respuestas
  - Fecha de realización
  - Feedback

#### 📚 Cursos y Ruta de Aprendizaje
- **Ubicación**: TalentDashboard → "FORMACION" → "Mi Ruta de Cursos"
- **Endpoints usados**:
  - `POST /learning-paths/me/generate`
  - `GET /learning-modules/me`
  - `PATCH /learning-modules/{moduleId}/progress`
- **Datos guardados**:
  - Módulos de aprendizaje
  - Progreso de módulos
  - Cursos pendientes
  - Cursos completados

---

## 2. COMPANY DASHBOARD (Visualización por Reclutador)

### Donde el Reclutador Ve los Datos:

#### 🔍 "Perfil del Candidato" - Skills Validadas Tab
- **Visualiza**: Skills del talento
- **Fuente**: `GET /recruiter/candidates/{candidateId}/skills`
- **Muestra**:
  - Nombre del skill
  - Badge "Validada"
  - Categoría inferida

#### 📄 "Perfil del Candidato" - CV + Resultados Tab
- **Visualiza**: Resumen del CV, resultados de pruebas, experiencia
- **Fuentes**:
  - `GET /recruiter/candidates/{candidateId}/cv` → CV
  - `GET /recruiter/candidates/{candidateId}/assessment-results` → Pruebas
  - `GET /recruiter/candidates/{candidateId}/learning-path` → Ruta
  - `GET /recruiter/candidates/{candidateId}/courses` → Cursos
- **Muestra**:
  - Resumen profesional
  - Resultado Prueba Técnica (% y feedback)
  - Resultado Prueba Psicotécnica (% y feedback)
  - Experiencia laboral parseada del CV
  - Roadmap recomendado
  - Cursos pendientes y aprobados

---

## 3. MAPEO DE DATOS: TALENTO → RECLUTADOR

| Dato del Talento | Endpoint Talento | Endpoint Reclutador | Ubicación en UI Reclutador |
|---|---|---|---|
| CV Parseado | POST /profiles/me/cv/diagnostics | GET /recruiter/candidates/{id}/cv | Tab "CV + Resultados" |
| Skills | POST /skills/me | GET /recruiter/candidates/{id}/skills | Tab "Skills Validadas" |
| Prueba Técnica | POST /assessments/me/technical-tests/submit | GET /recruiter/candidates/{id}/assessment-results | Tab "CV + Resultados" - Card Prueba Técnica |
| Prueba Psicotécnica | POST /assessments/me/psychotechnical-tests/submit | GET /recruiter/candidates/{id}/assessment-results | Tab "CV + Resultados" - Card Prueba Psicotécnica |
| Ruta de Aprendizaje | POST /learning-paths/me/generate | GET /recruiter/candidates/{id}/learning-path | Tab "CV + Resultados" (próxima integración) |
| Cursos | POST /learning-modules/{moduleId}/progress | GET /recruiter/candidates/{id}/courses | Tab "CV + Resultados" - "Cursos por Hacer" |

---

## 4. FLUJO TÉCNICO ACTUAL

### Frontend Implementado:

1. **TalentDashboard.tsx**
   - ✅ Carga datos del talento desde endpoints `/profiles/me/*`, `/skills/me`, `/assessments/me/*`, `/learning-paths/me`
   - ✅ Permite editar y guardar todos los datos
   - ✅ Muestra resultados de pruebas y cursos

2. **CompanyDashboard.tsx**
   - ✅ Lista candidatos desde `GET /recruiter/candidates`
   - ✅ Busca y filtra candidatos
   - ✅ Al hacer click "Mostrar detalle", llama a `recruiterService.getCandidateConsolidatedData()`
   - ✅ Muestra datos con fallback a MOCK si los endpoints no existen

3. **recruiter.service.ts**
   - ✅ Método `getCandidateConsolidatedData()` que obtiene todo de una vez O en paralelo
   - ✅ Métodos individuales para cada endpoint
   - ✅ Manejo de errores y fallbacks

### Backend Requerido:

**Actualmente disponibles:**
- ✅ `/profiles/me` - Perfil del talento
- ✅ `/skills/me` - Skills del talento
- ✅ `/assessments/me/test-results` - Resultados del talento

**Falta para reclutador:**
- ❌ `GET /recruiter/candidates` - Lista de candidatos
- ❌ `GET /recruiter/candidates/{id}` - Detalle de candidato
- ❌ `GET /recruiter/candidates/{id}/skills` - Skills del candidato
- ❌ `GET /recruiter/candidates/{id}/cv` - CV del candidato
- ❌ `GET /recruiter/candidates/{id}/assessment-results` - Pruebas del candidato
- ❌ `GET /recruiter/candidates/{id}/learning-path` - Ruta del candidato
- ❌ `GET /recruiter/candidates/{id}/courses` - Cursos del candidato

---

## 5. VALIDACIÓN ACTUAL

### ✅ Lo que Funciona Hoy:

1. **Talento crea datos**: CV, skills, realiza pruebas → Se guardan en backend
2. **Reclutador ve mock data**: CompanyDashboard muestra candidatos mock con datos de ejemplo
3. **UI preparada**: Búsqueda, filtros, tabs, detalle de candidato
4. **Service layer listo**: recruiter.service.ts esperando endpoints

### ⏳ Qué Falta:

Backend necesita implementar los 7 endpoints `/recruiter/candidates/*` para que:
- Reclutador pueda ver candidatos reales (no mock)
- Reclutador pueda ver CV real del candidato
- Reclutador pueda ver skills reales validados
- Reclutador pueda ver resultados reales de pruebas
- Reclutador pueda ver cursos reales completados/pendientes

---

## 6. PRÓXIMOS PASOS

### Immediate (Backend):
1. Implementar `/recruiter/candidates` - GET con filtros
2. Implementar `/recruiter/candidates/{id}` - GET detalle completo
3. Conectar con datos reales del talento

### Future (Frontend):
1. Agregar más tabs de detalle (Roadmap completo, Analytics)
2. Agregar acciones (notas, tags, estados de candidato)
3. Agregar exportación de perfiles

---

## 7. DIAGRAMA DEL FLUJO

```
┌─────────────────────────────────────────────────────────────────┐
│                      TALENT FLOW                                 │
│                   (User → Backend)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TalentDashboard.tsx                                            │
│  ├─ Load CV        → GET /profiles/me/cv/diagnostics           │
│  ├─ Save CV        → POST /profiles/me/cv/diagnostics          │
│  ├─ Load Skills    → GET /skills/me                            │
│  ├─ Save Skills    → POST/PATCH /skills/me/{id}               │
│  ├─ Generate Tests → POST /assessments/me/generate-tests      │
│  ├─ Submit Tests   → POST /assessments/me/*/submit            │
│  └─ Load Results   → GET /assessments/me/test-results         │
│                                                                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓ (Backend stores)
            ┌──────────────────────┐
            │  Backend Database    │
            │  ├─ Profiles         │
            │  ├─ Skills           │
            │  ├─ Assessment Tests │
            │  └─ Learning Paths   │
            └──────────────────────┘
                       │
                       ↓ (Recruiter fetches)
┌─────────────────────────────────────────────────────────────────┐
│                    RECRUITER FLOW                                │
│                  (Backend → Recruiter)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CompanyDashboard.tsx                                           │
│  ├─ List Candidates  → GET /recruiter/candidates               │
│  ├─ Search/Filter    → GET /recruiter/candidates?name=X        │
│  └─ View Detail      → GET /recruiter/candidates/{id}/         │
│                          ├─ cv                                  │
│                          ├─ skills                              │
│                          ├─ assessment-results                  │
│                          ├─ learning-path                       │
│                          └─ courses                             │
│                                                                  │
│  UI Tabs:                                                       │
│  ├─ Skills Validadas  (from /recruiter/candidates/{id}/skills) │
│  └─ CV + Resultados   (from /recruiter/candidates/{id}/cv,     │
│                         assessment-results, courses, etc.)      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. EJEMPLO DE INTERACCIÓN COMPLETA

### Talento (Alice) crea datos:
```
1. Sube CV en TalentDashboard
   → Backend guarda en Profile: name=Alice, title=Developer, CV parsed
   
2. Agrega skills en TalentDashboard
   → Backend guarda: {name: "JavaScript", category: "TECHNICAL", level: 4}
   
3. Realiza prueba técnica
   → Backend guarda resultado: {type: "technical", score: 92, feedback: "..."}
   
4. Completa cursos
   → Backend guarda: [course1, course2, ...]
```

### Reclutador (Bob) ve datos:
```
1. En CompanyDashboard busca "Developer"
   → Llama GET /recruiter/candidates?title=Developer
   → Encuentra Alice en la lista
   
2. Hace click "Mostrar detalle"
   → Llama GET /recruiter/candidates/alice-id/consolidated
   → Recibe: perfil + skills + cv + assessment-results + courses
   
3. Ve Tab "Skills Validadas"
   → Muestra: JavaScript (4/5)
   
4. Ve Tab "CV + Resultados"
   → Muestra: CV summary, Prueba Técnica 92%, Prueba Psicotécnica N/A
```

---

**Última actualización:** 2025-05-19  
**Estado:** Frontend listo, Backend endpoints pendientes
