# Endpoints Requeridos para Módulo de Reclutador

Estos endpoints deben ser implementados en el backend para que el módulo `CompanyDashboard` (Perfil del Candidato) funcione completamente con datos reales.

## Base

- **Base URL**: `http://localhost:3000`
- **Autenticación**: Bearer Token (JWT) en header `Authorization`
- **Rol requerido**: `COMPANY` o `RECRUITER`

## Endpoints

### 1. GET `/recruiter/candidates`
Obtiene lista de candidatos que el reclutador/empresa puede ver.

**Query Parameters:**
- `name` (string, opcional): Filtrar por nombre
- `title` (string, opcional): Filtrar por cargo/título
- `skill` (string, opcional): Filtrar por habilidad
- `minScore` (number, opcional): Puntaje de empleabilidad mínimo
- `status` (string, opcional): Estado del candidato

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "title": "Senior Developer",
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "New York, NY",
    "summary": "10+ years experience...",
    "skills": [
      {
        "id": "uuid",
        "name": "JavaScript",
        "category": "technical",
        "level": 5
      }
    ],
    "cv": {
      "url": "https://...",
      "uploadedAt": "2025-01-15T10:30:00Z"
    },
    "employabilityScore": 85,
    "interestedRoles": ["Developer", "Tech Lead"]
  }
]
```

---

### 2. GET `/recruiter/candidates/{candidateId}`
Obtiene detalles completos de un candidato específico.

**Path Parameters:**
- `candidateId` (string): ID del candidato

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "title": "Senior Developer",
  "email": "john@example.com",
  "phone": "+1234567890",
  "location": "New York, NY",
  "summary": "...",
  "skills": [...],
  "cv": {...},
  "assessmentResults": [
    {
      "id": "uuid",
      "type": "technical",
      "score": 92,
      "completedAt": "2025-01-10T15:20:00Z"
    }
  ],
  "learningPath": {
    "id": "uuid",
    "status": "in_progress",
    "progress": 45
  },
  "courses": [
    {
      "id": "uuid",
      "title": "Advanced TypeScript",
      "status": "in_progress",
      "progress": 65
    }
  ],
  "employabilityScore": 85
}
```

---

### 3. GET `/recruiter/candidates/{candidateId}/skills`
Obtiene habilidades del candidato.

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "JavaScript",
    "category": "technical",
    "level": 5,
    "yearsOfExperience": 8,
    "endorsements": 12
  }
]
```

---

### 4. GET `/recruiter/candidates/{candidateId}/cv`
Obtiene información del CV del candidato.

**Response (200 OK):**
```json
{
  "url": "https://bucket.example.com/cv.pdf",
  "uploadedAt": "2025-01-15T10:30:00Z",
  "extracted": {
    "summary": "...",
    "experience": [...],
    "education": [...]
  }
}
```

---

### 5. GET `/recruiter/candidates/{candidateId}/assessment-results`
Obtiene resultados de pruebas (técnicas y psicotécnicas) del candidato.

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "type": "technical",
    "testName": "JavaScript Advanced",
    "score": 92,
    "totalQuestions": 50,
    "correctAnswers": 46,
    "completedAt": "2025-01-10T15:20:00Z",
    "duration": 3600
  },
  {
    "id": "uuid",
    "type": "psychotechnical",
    "testName": "Personality & Skills",
    "score": 78,
    "completedAt": "2025-01-09T14:00:00Z",
    "dimensions": {
      "leadership": 85,
      "collaboration": 88,
      "problemSolving": 90
    }
  }
]
```

---

### 6. GET `/recruiter/candidates/{candidateId}/learning-path`
Obtiene ruta de aprendizaje del candidato.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "createdAt": "2024-12-01T10:00:00Z",
  "status": "in_progress",
  "progress": 45,
  "totalModules": 10,
  "completedModules": 4,
  "modules": [
    {
      "id": "uuid",
      "title": "Fundamentals",
      "status": "completed",
      "progress": 100
    }
  ]
}
```

---

### 7. GET `/recruiter/candidates/{candidateId}/courses`
Obtiene cursos en los que el candidato está inscrito o ha completado.

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "title": "Advanced TypeScript",
    "description": "...",
    "status": "in_progress",
    "progress": 65,
    "modules": 8,
    "completedModules": 5,
    "startedAt": "2024-12-15T09:00:00Z",
    "instructor": "Jane Smith",
    "company": "TechCorp"
  }
]
```

---

## Consideraciones de Seguridad

1. **Autorización**: El reclutador solo debe ver candidatos:
   - De su propia empresa (si es COMPANY)
   - Asignados a él (si es RECRUITER)
   - Que hayan sido contactados o matched

2. **Privacy**: No exponer:
   - Contraseñas o tokens
   - Datos bancarios o de pago
   - Información personal sensible no relevante

3. **Rate Limiting**: Implementar límite de requests para prevenir scraping

---

## Integración Frontend

El frontend ya tiene un servicio `recruiter.service.ts` preparado que:
- Intenta conectarse a estos endpoints
- Cae a modo mock si no están disponibles
- Proporciona fallback con `CANDIDATE_MOCK_DATA` en `CompanyDashboard.tsx`

Cuando los endpoints estén listos, la pantalla se actualizará automáticamente con datos reales.

---

## Estado Actual

- ✅ Frontend preparado con estructura
- ✅ Servicio con métodos y tipos
- ✅ Pantalla CompanyDashboard con fallback a mock
- ❌ Endpoints backend no existen aún
- ❌ Búsqueda de candidatos no está conectada
