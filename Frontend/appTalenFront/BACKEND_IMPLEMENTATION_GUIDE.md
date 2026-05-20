# Backend Implementation Guide - Talent Dashboard & Recruiter Dashboard

## 📋 Overview

Este documento detalla la arquitectura del backend, endpoints implementados y cómo implementar los faltantes para el dashboard de reclutadores.

---

## 🔧 Backend Configuration

**Base URL**: `http://localhost:3001`
**Framework**: NestJS
**Auth**: Bearer Token (JWT)
**Location**: `/Backend/app-talen-backend/src/modules/`

---

## ✅ IMPLEMENTED ENDPOINTS

### 1. PROFILE SERVICE (`/profiles/me`) - TALENTO

#### Crear/Obtener/Actualizar Perfil

```
POST   /profiles/me                           - Crear perfil
GET    /profiles/me                           - Obtener perfil actual
PATCH  /profiles/me                           - Actualizar perfil
PATCH  /profiles/me/preferences               - Actualizar preferencias laborales
PATCH  /profiles/me/interested-roles          - Actualizar roles de interés
PATCH  /profiles/me/employability-score       - Recalcular puntaje de empleabilidad
```

**Ejemplo**: Crear perfil de talento
```http
POST http://localhost:3001/profiles/me
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "fullName": "Juan Perez",
  "ageRange": "25-34",
  "location": "Buenos Aires",
  "headline": "Frontend Developer Junior",
  "yearsExperience": 1
}
```

---

#### Análisis y Diagnóstico de CV

```
POST   /profiles/me/cv/analyze                - Analizar CV (PDF o texto)
POST   /profiles/me/cv/diagnostics            - Guardar diagnóstico de CV
GET    /profiles/me/cv/diagnostics            - Listar historial de diagnósticos
GET    /profiles/me/cv/diagnostics/latest     - Obtener último diagnóstico
```

**Ejemplo**: Analizar CV desde texto
```http
POST http://localhost:3001/profiles/me/cv/analyze
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "applyToProfile": false,
  "extractedText": "Juan Perez\nFrontend Developer\n..."
}
```

---

### 2. SKILL SERVICE (`/skills/me`) - HABILIDADES DEL TALENTO

```
GET    /skills/me                             - Obtener todas las skills
POST   /skills/me                             - Crear nueva skill
PATCH  /skills/me/{skillId}                   - Actualizar skill
```

**Ejemplo**: Crear skill
```http
POST http://localhost:3001/skills/me
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "name": "React",
  "category": "digital",
  "level": "MEDIUM",
  "evidence": "Proyecto personal con componentes reutilizables",
  "source": "experiencia previa"
}
```

**Niveles válidos**: INITIAL, MEDIUM, ADVANCED, EXPERT

---

### 3. ASSESSMENT SERVICE - PRUEBAS TÉCNICAS Y PSICOTÉCNICAS

#### Gestión de Evaluaciones Generales

```
POST   /assessments/me                        - Crear evaluación general
GET    /assessments/me                        - Obtener evaluaciones
GET    /assessments/me/latest                 - Obtener última evaluación
```

#### Preguntas y Respuestas

```
GET    /assessments/psychotechnical-tests/questions  - Obtener preguntas psicotecnicas
GET    /assessments/technical-tests/questions        - Obtener preguntas técnicas
```

#### Enviar Pruebas (Submit)

```
POST   /assessments/me/psychotechnical-tests/submit  - Enviar prueba psicotecnica
POST   /assessments/me/technical-tests/submit        - Enviar prueba técnica
```

#### Crear Resultados Directamente

```
POST   /assessments/me/psychotechnical-tests         - Crear resultado psicotecnico
POST   /assessments/me/technical-tests               - Crear resultado técnico
```

#### Obtener Resultados

```
GET    /assessments/me/test-results           - Obtener todos los resultados
GET    /assessments/me/test-results/latest    - Obtener últimos resultados
```

**Ejemplo**: Enviar prueba técnica
```http
POST http://localhost:3001/assessments/me/technical-tests/submit
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "answers": {
    "tech_api_1": "b",
    "tech_db_1": "a",
    "tech_auth_1": "c"
  }
}
```

---

## ❌ NOT IMPLEMENTED - RECRUITER DASHBOARD ENDPOINTS

Estos endpoints DEBEN implementarse en el backend para que el dashboard de reclutadores funcione:

### Marketplace/Companies Module

#### Ver lista de candidatos disponibles

```
GET /recruiter/candidates
Query params: ?name=&title=&skill=&minScore=&status=
```

#### Ver perfil de candidato específico

```
GET /recruiter/candidates/{candidateId}
```

#### Ver habilidades de candidato

```
GET /recruiter/candidates/{candidateId}/skills
```

#### Ver CV de candidato

```
GET /recruiter/candidates/{candidateId}/cv
```

#### Ver resultados de pruebas de candidato

```
GET /recruiter/candidates/{candidateId}/assessment-results
```

#### Ver ruta de aprendizaje de candidato

```
GET /recruiter/candidates/{candidateId}/learning-path
```

#### Ver cursos de candidato

```
GET /recruiter/candidates/{candidateId}/courses
```

---

## 🏗️ IMPLEMENTATION PATTERN

### En Frontend: Adaptar profile.service.ts para recruiter

```typescript
// profile.service.ts - TALENTO (ya implementado)
export const getMyProfile = async (): Promise<Profile> => {
  try {
    const response = await api.get<Profile>('/profiles/me');
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

// recruiter.service.ts - RECLUTADOR (a implementar siguiendo patrón)
async getCandidateDetails(candidateId: string): Promise<CandidateProfile | null> {
  try {
    const response = await api.get(`/recruiter/candidates/${candidateId}`);
    return response.data || null;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.warn(`Recruiter candidate ${candidateId} details not available`, error.message);
    }
    return null;
  }
}
```

### En Backend: Crear endpoints en NestJS

**Ubicación**: `Backend/app-talen-backend/src/modules/marketplace/`

**Patrón de carpetas**:
```
marketplace/
├── domain/
│   ├── marketplace.entity.ts
│   └── marketplace.service.ts
├── infrastructure/
│   ├── marketplace.controller.ts
│   └── marketplace.repository.ts
└── marketplace.module.ts
```

**Ejemplo controller**:
```typescript
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { MarketplaceService } from '../domain/marketplace.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('recruiter')
@UseGuards(JwtGuard)
export class RecruiterController {
  constructor(private marketplaceService: MarketplaceService) {}

  @Get('candidates')
  async getCandidates(
    @Query('name') name?: string,
    @Query('title') title?: string,
    @Query('skill') skill?: string,
    @Query('minScore') minScore?: number,
    @Query('status') status?: string,
  ) {
    return this.marketplaceService.getCandidates({
      name,
      title,
      skill,
      minScore,
      status,
    });
  }

  @Get('candidates/:candidateId')
  async getCandidateDetails(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateDetails(candidateId);
  }

  @Get('candidates/:candidateId/skills')
  async getCandidateSkills(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateSkills(candidateId);
  }

  @Get('candidates/:candidateId/cv')
  async getCandidateCv(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateCv(candidateId);
  }

  @Get('candidates/:candidateId/assessment-results')
  async getCandidateAssessmentResults(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateAssessmentResults(candidateId);
  }

  @Get('candidates/:candidateId/learning-path')
  async getCandidateLearningPath(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateLearningPath(candidateId);
  }

  @Get('candidates/:candidateId/courses')
  async getCandidateCourses(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateCourses(candidateId);
  }
}
```

---

## 📊 Data Flow: Talento → Reclutador

### Lado Talento (TalentDashboard.tsx)
1. Usuario logea como TALENTO
2. Obtiene `/profiles/me` → Datos personales
3. Obtiene `/skills/me` → Sus skills
4. Obtiene `/assessments/me/test-results/latest` → Pruebas técnicas/psicotecnicas
5. Los datos se GUARDAN en BD

### Lado Reclutador (CompanyDashboard.tsx)
1. Usuario logea como RECRUITER/COMPANY
2. Obtiene `/recruiter/candidates` → Lista de candidatos disponibles
3. Hace click en candidato → Obtiene `/recruiter/candidates/{id}`
4. Obtiene datos consolidados:
   - `/recruiter/candidates/{id}/skills`
   - `/recruiter/candidates/{id}/assessment-results`
   - `/recruiter/candidates/{id}/cv`
   - `/recruiter/candidates/{id}/learning-path`
   - `/recruiter/candidates/{id}/courses`

---

## 🔐 Authorization

Todos los endpoints requieren:
- Bearer token válido en header `Authorization`
- Rol adecuado:
  - `/profiles/me/*` → TALENT
  - `/skills/me/*` → TALENT
  - `/assessments/me/*` → TALENT
  - `/recruiter/*` → COMPANY or RECRUITER

---

## 📝 HTTP Testing Files

Ubicación: `Backend/app-talen-backend/endpoints/`

- `profiles.http` - Pruebas de perfil
- `skills.http` - Pruebas de skills
- `assessment.http` - Pruebas de evaluaciones
- `marketplace.http` - (Agregar endpoints aquí cuando se implementen)

---

## ✨ Next Steps

1. **Frontend**: Corregir puerto en axiosInterface (3000 → 3001)
2. **Frontend**: Actualizar recruiter.service.ts con patrón de profile.service.ts
3. **Backend**: Implementar endpoints de marketplace/companies
4. **Backend**: Agregar endpoints HTTP en marketplace.http
5. **Testing**: Validar flujo completo: Talento sube datos → Reclutador ve datos
