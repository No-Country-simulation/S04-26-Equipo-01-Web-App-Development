# Backend Contract: Recruiter Vacancies

This document defines the backend contract required so the Company/Recruiter form persists and returns all vacancy fields correctly.

## 1) Endpoints

### POST /recruiter/vacancies
Creates a vacancy for the authenticated company/recruiter.

### GET /recruiter/vacancies
Returns the list of vacancies created by the authenticated company/recruiter.

Both endpoints must include support for the fields below.

## 2) Request DTO (POST)

```ts
interface CreateRecruiterVacancyDto {
  title: string;
  area?: string;
  modality?: 'remote' | 'hybrid' | 'onsite' | string;
  location?: string;
  contractType?: 'full-time' | 'part-time' | 'contractor' | 'internship' | string;
  seniority?: 'junior' | 'mid' | 'senior' | 'lead' | string;
  vacancies?: number;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  responsibilities?: string[];
  requiredSkills: string[];
  optionalSkills?: string[];
}
```

## 3) Validation Rules (recommended)

- `title`: required, string, min 3, max 120
- `description`: required, string, min 10, max 3000
- `requiredSkills`: required array, at least 1 item
- `vacancies`: integer >= 1
- `salaryMin`: number >= 0
- `salaryMax`: number >= 0
- if both salary values exist: `salaryMax >= salaryMin`
- `responsibilities` and `optionalSkills`: array of non-empty strings

## 4) Response Contract (POST and GET)

The backend can return camelCase or snake_case, but values must be present.

### Preferred camelCase response

```json
{
  "id": "vac_123",
  "companyId": "cmp_001",
  "title": "Desarrollador full stack",
  "area": "Ingenieria",
  "description": "Desarrollo y mantenimiento de aplicaciones web...",
  "requiredSkills": ["React", "Node.js"],
  "optionalSkills": ["Docker", "AWS"],
  "responsibilities": ["Desarrollar nuevas features", "Corregir bugs"],
  "contractType": "full-time",
  "seniority": "mid",
  "salaryMin": 3500,
  "salaryMax": 5000,
  "location": "Bogota",
  "modality": "hybrid",
  "vacancies": 2,
  "createdAt": "2026-05-26T12:00:00.000Z"
}
```

### Accepted snake_case compatibility (legacy)

```json
{
  "id": "vac_123",
  "company_id": "cmp_001",
  "title": "Desarrollador full stack",
  "area": "Ingenieria",
  "description": "Desarrollo y mantenimiento de aplicaciones web...",
  "required_skills": ["React", "Node.js"],
  "optional_skills": ["Docker", "AWS"],
  "responsibilities": ["Desarrollar nuevas features", "Corregir bugs"],
  "contract_type": "full-time",
  "seniority": "mid",
  "salary_min": 3500,
  "salary_max": 5000,
  "location": "Bogota",
  "modality": "hybrid",
  "vacancies": 2,
  "created_at": "2026-05-26T12:00:00.000Z"
}
```

## 5) DB / Entity Fields Required

Ensure the vacancy table/entity includes:

- `area` (varchar nullable)
- `contract_type` (varchar nullable)
- `seniority` (varchar nullable)
- `salary_min` (numeric/decimal nullable)
- `salary_max` (numeric/decimal nullable)
- `responsibilities` (json/jsonb/text[] nullable)
- `optional_skills` (json/jsonb/text[] nullable)

Also verify existing fields already used by frontend:

- `title`, `description`, `required_skills`, `location`, `modality`, `vacancies`, `created_at`, `company_id`

## 6) Example SQL Migration (PostgreSQL)

```sql
ALTER TABLE recruiter_vacancies
  ADD COLUMN IF NOT EXISTS area VARCHAR(120),
  ADD COLUMN IF NOT EXISTS contract_type VARCHAR(40),
  ADD COLUMN IF NOT EXISTS seniority VARCHAR(40),
  ADD COLUMN IF NOT EXISTS salary_min NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS salary_max NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS responsibilities JSONB,
  ADD COLUMN IF NOT EXISTS optional_skills JSONB;
```

## 7) Backend Implementation Checklist

- Parse and persist all fields from POST payload.
- Return all fields in POST response.
- Return all fields in GET /recruiter/vacancies response.
- Keep naming consistent (prefer camelCase in API response).
- Add unit/integration tests for create and list flow with the new fields.

## 8) Quick QA Scenario

1. Create vacancy from frontend with:
   - area: "Ingenieria"
   - salaryMin: 3500
   - salaryMax: 5000
   - description: non-empty text
   - responsibilities: 2 lines
   - optionalSkills: 2 lines
2. Verify POST payload in Network tab includes these keys.
3. Verify backend response includes same values.
4. Refresh page and open "Cargar vacante existente".
5. Confirm area/salary/description are visible and preserved.
