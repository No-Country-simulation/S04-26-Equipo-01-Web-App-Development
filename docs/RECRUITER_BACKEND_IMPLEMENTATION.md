# 🚀 Implementación Backend: Endpoints para Dashboard de Reclutadores

## ✅ Cambios Realizados en Frontend

### 1. **Corregido Puerto del Backend**
- **Archivo**: [src/feactures/api/axiosInterface.ts](src/feactures/api/axiosInterface.ts)
- **Cambio**: `http://localhost:3000` → `http://localhost:3001`
- **Razón**: Backend está en puerto 3001, no 3000

### 2. **Refactorizado recruiter.service.ts**
- **Archivo**: [src/services/recruiter.service.ts](src/services/recruiter.service.ts)
- **Cambios**:
  - Convertidas clases a funciones independientes (patrón consistente con `profile.service.ts`)
  - Agregado manejo robusto de errores
  - Implementadas funciones:
    - `getCandidates(filters?)` - Lista de candidatos
    - `getCandidateDetails(candidateId)` - Perfil de candidato
    - `getCandidateSkills(candidateId)` - Skills del candidato
    - `getCandidateCv(candidateId)` - CV del candidato
    - `getCandidateAssessmentResults(candidateId)` - Resultados de pruebas
    - `getCandidateLearningPath(candidateId)` - Ruta de aprendizaje
    - `getCandidateCourses(candidateId)` - Cursos del candidato
    - `getCandidateConsolidatedData(candidateId)` - Datos completos consolidados

### 3. **Actualizado CompanyDashboard.tsx**
- **Archivo**: [src/feactures/marketplace/CompanyDashboard.tsx](src/feactures/marketplace/CompanyDashboard.tsx)
- **Cambios**:
  - Actualizado imports para usar funciones en lugar de clase
  - Mantiene fallback a mock data si endpoints no disponibles
  - Carga candidatos reales al iniciar

---

## 📋 Pendiente: Implementar Endpoints en Backend

### Ubicación de Implementación
```
Backend/app-talen-backend/
├── src/modules/
│   ├── marketplace/
│   │   ├── domain/
│   │   │   ├── marketplace.service.ts (nuevo)
│   │   │   └── marketplace.entity.ts (nuevo)
│   │   ├── infrastructure/
│   │   │   ├── recruiter.controller.ts (nuevo)
│   │   │   └── recruiter.repository.ts (nuevo)
│   │   └── marketplace.module.ts (actualizar)
```

### Endpoints a Implementar

#### 1. **GET /recruiter/candidates**
Lista de candidatos con filtros opcionales

```typescript
// Query params
?name=&title=&skill=&minScore=&status=

// Response: CandidateProfile[]
{
  id: string;
  name: string;
  title: string;
  email: string;
  location?: string;
  summary?: string;
  skills: { id, name, category, level }[];
  employabilityScore?: number;
}
```

#### 2. **GET /recruiter/candidates/:candidateId**
Perfil completo de candidato específico

```typescript
// Response: CandidateProfile
{
  id, name, title, email, phone, location, summary,
  skills: [],
  cv: { url, uploadedAt },
  employabilityScore,
  interestedRoles
}
```

#### 3. **GET /recruiter/candidates/:candidateId/skills**
Todas las skills del candidato

```typescript
// Response: CandidateSkill[]
[
  {
    id: string;
    name: string;
    category: string;
    level: number;
    yearsOfExperience?: number;
    validated?: boolean;
  }
]
```

#### 4. **GET /recruiter/candidates/:candidateId/cv**
CV del candidato

```typescript
// Response: CandidateCvData
{
  url: string;
  uploadedAt: string;
  parsed?: {
    profile: {...},
    experience: [...],
    education: [...],
    skills: {...}
  }
}
```

#### 5. **GET /recruiter/candidates/:candidateId/assessment-results**
Resultados de pruebas técnicas y psicotécnicas

```typescript
// Response: CandidateAssessmentResult[]
[
  {
    id: string;
    type: 'technical' | 'psychotechnical';
    testName: string;
    score: number;
    completedAt: string;
    feedback?: string;
    dimensions?: Record<string, number>;
  }
]
```

#### 6. **GET /recruiter/candidates/:candidateId/learning-path**
Ruta de aprendizaje del candidato

```typescript
// Response
{
  id: string;
  status: string;
  progress: number;
}
```

#### 7. **GET /recruiter/candidates/:candidateId/courses**
Cursos realizados o en progreso

```typescript
// Response: CandidateCourseData[]
[
  {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    progress: number;
    modules: number;
    completedModules: number;
  }
]
```

---

## 🔧 Pasos de Implementación

### Paso 1: Crear Controller de Reclutadores

**Archivo**: `Backend/app-talen-backend/src/modules/marketplace/infrastructure/recruiter.controller.ts`

```typescript
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { MarketplaceService } from '../domain/marketplace.service';

@Controller('recruiter')
@UseGuards(JwtGuard)
export class RecruiterController {
  constructor(private marketplaceService: MarketplaceService) {}

  @Get('candidates')
  @Roles('COMPANY', 'RECRUITER')
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
  @Roles('COMPANY', 'RECRUITER')
  async getCandidateDetails(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateDetails(candidateId);
  }

  @Get('candidates/:candidateId/skills')
  @Roles('COMPANY', 'RECRUITER')
  async getCandidateSkills(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateSkills(candidateId);
  }

  @Get('candidates/:candidateId/cv')
  @Roles('COMPANY', 'RECRUITER')
  async getCandidateCv(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateCv(candidateId);
  }

  @Get('candidates/:candidateId/assessment-results')
  @Roles('COMPANY', 'RECRUITER')
  async getCandidateAssessmentResults(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateAssessmentResults(candidateId);
  }

  @Get('candidates/:candidateId/learning-path')
  @Roles('COMPANY', 'RECRUITER')
  async getCandidateLearningPath(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateLearningPath(candidateId);
  }

  @Get('candidates/:candidateId/courses')
  @Roles('COMPANY', 'RECRUITER')
  async getCandidateCourses(@Param('candidateId') candidateId: string) {
    return this.marketplaceService.getCandidateCourses(candidateId);
  }
}
```

### Paso 2: Crear Service de Marketplace

**Archivo**: `Backend/app-talen-backend/src/modules/marketplace/domain/marketplace.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ProfilesRepository } from '../../profiles/infrastructure/profiles.repository';
import { SkillsRepository } from '../../skills/infrastructure/skills.repository';
import { AssessmentRepository } from '../../assessment/infrastructure/assessment.repository';
import { LearningRepository } from '../../learning/infrastructure/learning.repository';

@Injectable()
export class MarketplaceService {
  constructor(
    private profilesRepository: ProfilesRepository,
    private skillsRepository: SkillsRepository,
    private assessmentRepository: AssessmentRepository,
    private learningRepository: LearningRepository,
  ) {}

  async getCandidates(filters: any) {
    // Obtener candidatos con búsqueda y filtros
    return this.profilesRepository.findCandidates(filters);
  }

  async getCandidateDetails(candidateId: string) {
    // Obtener perfil completo del candidato
    return this.profilesRepository.findById(candidateId);
  }

  async getCandidateSkills(candidateId: string) {
    // Obtener todas las skills del candidato
    return this.skillsRepository.findByUserId(candidateId);
  }

  async getCandidateCv(candidateId: string) {
    // Obtener CV del candidato
    return this.profilesRepository.findCvByCandidateId(candidateId);
  }

  async getCandidateAssessmentResults(candidateId: string) {
    // Obtener resultados de pruebas
    return this.assessmentRepository.findAssessmentResults(candidateId);
  }

  async getCandidateLearningPath(candidateId: string) {
    // Obtener ruta de aprendizaje
    return this.learningRepository.findLearningPath(candidateId);
  }

  async getCandidateCourses(candidateId: string) {
    // Obtener cursos realizados
    return this.learningRepository.findCoursesByUserId(candidateId);
  }
}
```

### Paso 3: Registrar Controller en Módulo

**Archivo**: `Backend/app-talen-backend/src/modules/marketplace/marketplace.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { RecruiterController } from './infrastructure/recruiter.controller';
import { MarketplaceService } from './domain/marketplace.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { SkillsModule } from '../skills/skills.module';
import { AssessmentModule } from '../assessment/assessment.module';
import { LearningModule } from '../learning/learning.module';

@Module({
  imports: [ProfilesModule, SkillsModule, AssessmentModule, LearningModule],
  controllers: [RecruiterController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
```

---

## 📝 Testing de Endpoints

Una vez implementados, agregar a `Backend/app-talen-backend/endpoints/marketplace.http`:

```http
@baseUrl = http://localhost:3001
@accessToken = <TOKEN_DEL_RECLUTADOR>

### Get candidates list
GET {{baseUrl}}/recruiter/candidates?minScore=70
Authorization: Bearer {{accessToken}}

### Get candidate details
GET {{baseUrl}}/recruiter/candidates/candidate-id-123
Authorization: Bearer {{accessToken}}

### Get candidate skills
GET {{baseUrl}}/recruiter/candidates/candidate-id-123/skills
Authorization: Bearer {{accessToken}}

### Get candidate CV
GET {{baseUrl}}/recruiter/candidates/candidate-id-123/cv
Authorization: Bearer {{accessToken}}

### Get candidate assessment results
GET {{baseUrl}}/recruiter/candidates/candidate-id-123/assessment-results
Authorization: Bearer {{accessToken}}

### Get candidate learning path
GET {{baseUrl}}/recruiter/candidates/candidate-id-123/learning-path
Authorization: Bearer {{accessToken}}

### Get candidate courses
GET {{baseUrl}}/recruiter/candidates/candidate-id-123/courses
Authorization: Bearer {{accessToken}}
```

---

## 🔒 Consideraciones de Seguridad

1. **Autenticación**: Todos los endpoints requieren JWT válido
2. **Autorización**: Solo roles COMPANY o RECRUITER pueden acceder
3. **Validación**: Validar que reclutador solo vea candidatos que le pertenecen
4. **Rate Limiting**: Considerar agregar límites de llamadas

---

## ✨ Validación Completa

Para validar que todo funciona:

1. ✅ Frontend corrigido (puerto 3001)
2. ✅ recruiter.service.ts refactorizado
3. ✅ CompanyDashboard.tsx actualizado
4. ⏳ Backend: Implementar endpoints (próximo paso)
5. ⏳ Testing: Verificar flujo completo Talento → Reclutador
