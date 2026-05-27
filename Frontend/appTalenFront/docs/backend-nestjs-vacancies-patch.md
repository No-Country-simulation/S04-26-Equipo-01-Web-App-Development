# Patch listo para backend (NestJS): Vacantes con campos extendidos

Este parche corrige el error 400 de whitelist (property should not exist) y permite persistir/retornar:

- area
- contractType
- seniority
- salaryMin
- salaryMax
- responsibilities
- optionalSkills

## 1) DTO: create-recruiter-vacancy.dto.ts

```ts
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ArrayMinSize,
} from 'class-validator';

export class CreateRecruiterVacancyDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  area?: string;

  @IsOptional()
  @IsString()
  modality?: 'remote' | 'hybrid' | 'onsite' | string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsString()
  contractType?: 'full-time' | 'part-time' | 'contractor' | 'internship' | string;

  @IsOptional()
  @IsString()
  seniority?: 'junior' | 'mid' | 'senior' | 'lead' | string;

  @IsOptional()
  @IsInt()
  @Min(1)
  vacancies?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @IsString()
  @MaxLength(3000)
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  responsibilities?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  requiredSkills: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionalSkills?: string[];

  @ValidateIf((o) => o.salaryMin !== undefined && o.salaryMax !== undefined)
  validateSalaryRange(): boolean {
    return Number(this.salaryMax) >= Number(this.salaryMin);
  }
}
```

Si prefieren validación de salaryMax >= salaryMin con mensaje custom, usar un validator class-level.

## 2) Entity: recruiter-vacancy.entity.ts (TypeORM ejemplo)

```ts
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('recruiter_vacancies')
export class RecruiterVacancyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  area?: string;

  @Column({ name: 'contract_type', type: 'varchar', length: 40, nullable: true })
  contractType?: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  seniority?: string;

  @Column({ name: 'salary_min', type: 'numeric', precision: 12, scale: 2, nullable: true })
  salaryMin?: number;

  @Column({ name: 'salary_max', type: 'numeric', precision: 12, scale: 2, nullable: true })
  salaryMax?: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  modality?: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  location?: string;

  @Column({ type: 'int', default: 1 })
  vacancies: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'required_skills', type: 'jsonb', default: () => "'[]'" })
  requiredSkills: string[];

  @Column({ name: 'optional_skills', type: 'jsonb', default: () => "'[]'" })
  optionalSkills: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  responsibilities: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

## 3) Service: mapear DTO completo en create

```ts
async createVacancy(companyId: string, dto: CreateRecruiterVacancyDto) {
  const entity = this.vacancyRepo.create({
    companyId,
    title: dto.title,
    area: dto.area,
    modality: dto.modality,
    location: dto.location,
    contractType: dto.contractType,
    seniority: dto.seniority,
    vacancies: dto.vacancies ?? 1,
    salaryMin: dto.salaryMin,
    salaryMax: dto.salaryMax,
    description: dto.description,
    requiredSkills: dto.requiredSkills,
    optionalSkills: dto.optionalSkills ?? [],
    responsibilities: dto.responsibilities ?? [],
  });

  const saved = await this.vacancyRepo.save(entity);
  return this.toResponse(saved);
}

private toResponse(v: RecruiterVacancyEntity) {
  return {
    id: v.id,
    companyId: v.companyId,
    title: v.title,
    area: v.area,
    description: v.description,
    requiredSkills: v.requiredSkills,
    optionalSkills: v.optionalSkills,
    responsibilities: v.responsibilities,
    contractType: v.contractType,
    seniority: v.seniority,
    salaryMin: v.salaryMin,
    salaryMax: v.salaryMax,
    location: v.location,
    modality: v.modality,
    vacancies: v.vacancies,
    createdAt: v.createdAt,
  };
}
```

## 4) Controller: usar DTO actualizado

```ts
@Post('recruiter/vacancies')
@UseGuards(AuthGuard('jwt'))
create(
  @CurrentUser() user: JwtUser,
  @Body() dto: CreateRecruiterVacancyDto,
) {
  return this.recruiterVacancyService.createVacancy(user.companyId ?? user.sub, dto);
}

@Get('recruiter/vacancies')
@UseGuards(AuthGuard('jwt'))
list(@CurrentUser() user: JwtUser) {
  return this.recruiterVacancyService.listMyVacancies(user.companyId ?? user.sub);
}
```

## 5) Migración SQL (PostgreSQL)

```sql
ALTER TABLE recruiter_vacancies
  ADD COLUMN IF NOT EXISTS area VARCHAR(120),
  ADD COLUMN IF NOT EXISTS contract_type VARCHAR(40),
  ADD COLUMN IF NOT EXISTS seniority VARCHAR(40),
  ADD COLUMN IF NOT EXISTS salary_min NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS salary_max NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS responsibilities JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS optional_skills JSONB DEFAULT '[]'::jsonb;
```

## 6) ValidationPipe (si aplica)

Si su app usa:

```ts
new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
```

entonces es obligatorio que el DTO declare todos estos campos. Este parche lo resuelve.

## 7) Prueba rápida backend (post patch)

1. POST /recruiter/vacancies con payload completo.
2. Verificar 201 y que response tenga area/salaryMin/salaryMax/description.
3. GET /recruiter/vacancies y confirmar mismos valores.

Payload ejemplo:

```json
{
  "title": "Desarrollador Full Stack",
  "area": "Ingenieria",
  "modality": "hybrid",
  "location": "Bogota",
  "contractType": "full-time",
  "seniority": "mid",
  "vacancies": 2,
  "salaryMin": 3500,
  "salaryMax": 5000,
  "description": "Vacante para equipo de producto",
  "responsibilities": ["Construir features", "Corregir bugs"],
  "requiredSkills": ["React", "Node.js"],
  "optionalSkills": ["Docker", "AWS"]
}
```

## 8) Resultado esperado en frontend

- En Crear Solicitud, los campos area/salarios/descripcion se guardan.
- En Cargar vacante existente, se repueblan correctamente tras refresh.
