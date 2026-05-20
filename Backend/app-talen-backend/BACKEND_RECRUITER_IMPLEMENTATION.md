# 📊 COMPARATIVA: Mock Data vs Datos Reales BD

## Mock Data Actual en Frontend (CompanyDashboard.tsx)

### Candidato 1 - Leandro Suarez
```
{
  id: 'cand-01',
  fullName: 'Leandro Suarez',
  title: 'Backend .NET Developer',
  location: 'Buenos Aires, AR',
  skillsValidated: ['.net', 'c#', 'sql server', 'web api', 'git', 'scrum'],
  cvSummary: 'Desarrollador backend con experiencia en APIs REST...',
  technicalResult: { scorePct: 82, feedback: 'Buen dominio...' },
  psychotechnicalResult: { scorePct: 76, feedback: 'Perfil colaborativo...' },
  roadmapRecommended: ['Testing avanzado...', '...'],
  pendingCourses: ['Testing con xUnit', 'Clean Architecture en .NET', 'SQL Performance Tuning'],
  approvedCourses: ['Fundamentos de APIs REST', 'Git para equipos agiles']
}
```

### Candidato 2 - Mariana Paredes
```
{
  id: 'cand-02',
  fullName: 'Mariana Paredes',
  title: 'Full Stack Developer',
  location: 'Lima, PE',
  skillsValidated: ['react', 'node js', 'sql', 'github', 'comunicacion'],
  ...
}
```

### Candidato 3 - Cesar Villanueva
```
{
  id: 'cand-03',
  fullName: 'Cesar Villanueva',
  title: 'QA Automation Engineer',
  location: 'Medellin, CO',
  skillsValidated: ['selenium', 'api', 'sql', 'git', 'precision tecnica'],
  ...
}
```

---

## Datos Reales que DEBERÍAN estar en BD

Para obtener estos datos, ejecutar queries en: [QUERIES_DATABASE.sql](QUERIES_DATABASE.sql)

### De tabla `profiles`:
- `id` (uuid)
- `fullName` 
- `headline` (→ title)
- `email` (de tabla `user`)
- `location`
- `professionalBio` (→ summary)
- `employabilityScore`

### De tabla `user_skill`:
- Skills del candidato con nombre, categoría, nivel

### De tabla `assessment_test_result`:
- Resultados de pruebas técnicas (score, feedback)
- Resultados de pruebas psicotécnicas (score, feedback)

### De tabla `course`:
- Cursos completados
- Cursos en progreso
- Cursos pendientes

---

## ⚠️ PROBLEMA ACTUAL

El frontend **SIEMPRE MUESTRA MOCK DATA** porque:

1. **Frontend llama** → `getCandidates()` en `recruiter.service.ts`
2. **Backend NO responde** → Endpoint `/recruiter/candidates` NO EXISTE
3. **Frontend usa fallback** → Muestra `CANDIDATE_MOCK_DATA`

```typescript
// En CompanyDashboard.tsx
try {
  const realCandidates = await getCandidates(); // ← Falla porque endpoint no existe
  if (realCandidates && realCandidates.length > 0) {
    // Nunca llega aquí
    const mappedCandidates = ...
    setCandidates(mappedCandidates);
  } else {
    setCandidates(CANDIDATE_MOCK_DATA); // ← Aquí llega, muestra mock
  }
} catch (error) {
  console.warn('No se pudieron cargar candidatos reales, usando mock data', error);
  setCandidates(CANDIDATE_MOCK_DATA); // ← O aquí
}
```

---

## ✅ SOLUCIÓN: IMPLEMENTAR ENDPOINTS EN BACKEND

### Paso 1: Crear Recruiter Controller

**Ubicación**: `Backend/app-talen-backend/src/modules/marketplace/infrastructure/recruiter.controller.ts`

```typescript
import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { Roles } from '../../auth/infrastructure/decorators/roles.decorator';
import { UserRole } from '../../users/domain/user-role.enum';
import { MarketplaceService } from '../domain/marketplace.service';
import { AuthenticatedRequest } from '../../auth/infrastructure/types/authenticated-request.type';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Recruiter')
@ApiBearerAuth()
@Controller('recruiter')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.COMPANY, UserRole.RECRUITER)
export class RecruiterController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

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

### Paso 2: Crear Marketplace Service

**Ubicación**: `Backend/app-talen-backend/src/modules/marketplace/domain/marketplace.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../../profiles/infrastructure/entities/profile.entity';
import { UserSkill } from '../../skills/infrastructure/entities/user-skill.entity';
import { Assessment } from '../../assessment/infrastructure/entities/assessment.entity';
import { User } from '../../users/infrastructure/entities/user.entity';
import { UserRole } from '../../users/domain/user-role.enum';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(UserSkill)
    private skillRepository: Repository<UserSkill>,
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getCandidates(filters: any) {
    const query = this.profileRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'u')
      .leftJoinAndSelect('p.skills', 'skills')
      .where('u.role = :role', { role: UserRole.TALENT });

    if (filters.name) {
      query.andWhere('p.fullName ILIKE :name', { name: `%${filters.name}%` });
    }

    if (filters.title) {
      query.andWhere('p.headline ILIKE :title', { title: `%${filters.title}%` });
    }

    if (filters.minScore !== undefined) {
      query.andWhere('p.employabilityScore >= :minScore', { minScore: filters.minScore });
    }

    return query.getMany();
  }

  async getCandidateDetails(candidateId: string) {
    return this.profileRepository.findOne({
      where: { id: candidateId },
      relations: ['user', 'skills', 'assessments', 'learningPaths', 'cvDiagnostics'],
    });
  }

  async getCandidateSkills(candidateId: string) {
    const profile = await this.profileRepository.findOne({
      where: { id: candidateId },
      relations: ['skills'],
    });
    return profile?.skills || [];
  }

  async getCandidateCv(candidateId: string) {
    const profile = await this.profileRepository.findOne({
      where: { id: candidateId },
      relations: ['cvDiagnostics'],
    });

    if (profile?.cvDiagnostics?.length) {
      const latest = profile.cvDiagnostics[profile.cvDiagnostics.length - 1];
      return {
        url: latest.cvFileUrl || null,
        uploadedAt: latest.createdAt,
        parsed: latest.analysis,
      };
    }

    return null;
  }

  async getCandidateAssessmentResults(candidateId: string) {
    const profile = await this.profileRepository.findOne({
      where: { id: candidateId },
      relations: ['assessments', 'assessments.testResults'],
    });

    const results = [];
    if (profile?.assessments) {
      for (const assessment of profile.assessments) {
        if (assessment.testResults) {
          results.push(
            ...assessment.testResults.map((tr) => ({
              id: tr.id,
              type: assessment.type,
              testName: tr.testName || assessment.type,
              score: tr.score,
              completedAt: tr.completedAt,
              feedback: tr.feedback,
              dimensions: tr.dimensions,
            })),
          );
        }
      }
    }

    return results;
  }

  async getCandidateLearningPath(candidateId: string) {
    const profile = await this.profileRepository.findOne({
      where: { id: candidateId },
      relations: ['learningPaths'],
    });

    if (profile?.learningPaths?.length) {
      const path = profile.learningPaths[0];
      return {
        id: path.id,
        status: path.status,
        progress: path.progress,
      };
    }

    return null;
  }

  async getCandidateCourses(candidateId: string) {
    const profile = await this.profileRepository.findOne({
      where: { id: candidateId },
      relations: ['learningPaths', 'learningPaths.courses'],
    });

    const courses = [];
    if (profile?.learningPaths) {
      for (const path of profile.learningPaths) {
        if (path.courses) {
          courses.push(
            ...path.courses.map((c) => ({
              id: c.id,
              title: c.title,
              description: c.description,
              status: c.status,
              progress: c.progress,
              modules: c.modules || 0,
              completedModules: c.completedModules || 0,
              startedAt: c.startedAt,
            })),
          );
        }
      }
    }

    return courses;
  }
}
```

### Paso 3: Actualizar Marketplace Module

**Ubicación**: `Backend/app-talen-backend/src/modules/marketplace/marketplace.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruiterController } from './infrastructure/recruiter.controller';
import { MarketplaceService } from './domain/marketplace.service';
import { Profile } from '../profiles/infrastructure/entities/profile.entity';
import { UserSkill } from '../skills/infrastructure/entities/user-skill.entity';
import { Assessment } from '../assessment/infrastructure/entities/assessment.entity';
import { User } from '../users/infrastructure/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, UserSkill, Assessment, User])],
  controllers: [RecruiterController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
```

---

## 🧪 Testing

Crear requests en `Backend/app-talen-backend/endpoints/marketplace.http`:

```http
@baseUrl = http://localhost:3001
@recruiterToken = <TOKEN_RECRUITER>

### Get all candidates
GET {{baseUrl}}/recruiter/candidates
Authorization: Bearer {{recruiterToken}}

### Get candidate details
GET {{baseUrl}}/recruiter/candidates/uuid-here
Authorization: Bearer {{recruiterToken}}

### Get candidate skills
GET {{baseUrl}}/recruiter/candidates/uuid-here/skills
Authorization: Bearer {{recruiterToken}}

### Get candidate CV
GET {{baseUrl}}/recruiter/candidates/uuid-here/cv
Authorization: Bearer {{recruiterToken}}

### Get candidate assessment results
GET {{baseUrl}}/recruiter/candidates/uuid-here/assessment-results
Authorization: Bearer {{recruiterToken}}

### Get candidate learning path
GET {{baseUrl}}/recruiter/candidates/uuid-here/learning-path
Authorization: Bearer {{recruiterToken}}

### Get candidate courses
GET {{baseUrl}}/recruiter/candidates/uuid-here/courses
Authorization: Bearer {{recruiterToken}}
```

---

## 🎯 Resultado Esperado

Después de implementar:

1. ✅ Frontend llama `getCandidates()`
2. ✅ Backend retorna DATOS REALES de BD
3. ✅ Dashboard muestra perfil de candidato con:
   - Datos personales reales
   - Skills reales de BD
   - Resultados de pruebas reales
   - Cursos realizados reales
4. ✅ Ya NO mostrar mock data

---

## 📋 Archivos a Modificar/Crear

- [ ] **CREAR**: `src/modules/marketplace/infrastructure/recruiter.controller.ts`
- [ ] **CREAR**: `src/modules/marketplace/domain/marketplace.service.ts`
- [ ] **ACTUALIZAR**: `src/modules/marketplace/marketplace.module.ts`
- [ ] **CREAR**: `endpoints/marketplace.http` (para testing)
