# Validation Checklist: Talent → Recruiter Data Flow

## Pre-Validation (Before Backend Implementation)

### ✅ Frontend Ready Checks

- [x] TalentDashboard loads and displays talent data
- [x] CompanyDashboard loads and displays mock candidate data
- [x] Search & filter on CompanyDashboard works (Enter key, Buscar button)
- [x] "Mostrar detalle" button loads candidate detail view
- [x] Skills tab displays skills
- [x] CV + Resultados tab displays CV, test results, courses
- [x] TypeScript compilation: No errors
- [x] recruiter.service.ts ready with all 7 methods
- [x] Error handling and fallbacks implemented

---

## Post-Backend Implementation Validation

### Step 1: Backend Endpoints Available

Run this PowerShell check:
```powershell
$base = "http://localhost:3000"
$endpoints = @(
  "/recruiter/candidates",
  "/recruiter/candidates/test-id/cv",
  "/recruiter/candidates/test-id/skills",
  "/recruiter/candidates/test-id/assessment-results"
)

foreach ($ep in $endpoints) {
  try {
    $r = Invoke-WebRequest -Uri ($base + $ep) -Headers @{Authorization = "Bearer YOUR_TOKEN"} -UseBasicParsing -TimeoutSec 5
    Write-Host "$ep => HTTP $($r.StatusCode)" -ForegroundColor Green
  } catch {
    $status = $_.Exception.Response.StatusCode.value__ 2>$null
    Write-Host "$ep => $status" -ForegroundColor Red
  }
}
```

### Step 2: Data Structure Validation

#### 2a. Candidates List Response
Test: `GET /recruiter/candidates`

**Expected Response:**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "title": "Developer",
    "email": "john@example.com",
    "location": "New York",
    "summary": "...",
    "skills": [
      {
        "id": "uuid",
        "name": "JavaScript",
        "category": "technical",
        "level": 4
      }
    ],
    "employabilityScore": 85
  }
]
```

**Frontend Check:**
- Candidates appear in CompanyDashboard list
- Search filters work correctly
- "Mostrar detalle" button works

---

#### 2b. Candidate Details Response
Test: `GET /recruiter/candidates/{candidateId}`

**Expected Response:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "title": "Developer",
  "email": "john@example.com",
  "location": "New York",
  "summary": "Senior developer with 5+ years experience",
  "skills": [
    {
      "id": "uuid",
      "name": "JavaScript",
      "category": "technical",
      "level": 4,
      "validated": true
    }
  ],
  "employabilityScore": 85,
  "interestedRoles": ["Tech Lead", "Senior Developer"]
}
```

**Frontend Check:**
- Detail view loads without errors
- Skills tab shows list of skills

---

#### 2c. Skills Response
Test: `GET /recruiter/candidates/{candidateId}/skills`

**Expected Response:**
```json
[
  {
    "id": "uuid",
    "name": "JavaScript",
    "category": "technical",
    "level": 4,
    "yearsOfExperience": 5
  },
  {
    "id": "uuid",
    "name": "Team Leadership",
    "category": "personal",
    "level": 3
  }
]
```

**Frontend Check:**
- Skills display in tab "Skills Validadas"
- Each skill shows with "Validada" badge

---

#### 2d. CV Response
Test: `GET /recruiter/candidates/{candidateId}/cv`

**Expected Response:**
```json
{
  "url": "https://storage.example.com/cv-john-doe.pdf",
  "uploadedAt": "2025-01-15T10:30:00Z",
  "parsed": {
    "profile": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "location": "New York, NY",
      "title": "Senior Developer",
      "summary": "Experienced full-stack developer with expertise in..."
    },
    "experience": [
      {
        "company": "Tech Corp",
        "position": "Senior Developer",
        "startDate": "2020-01",
        "endDate": "2025-05",
        "description": "Led development of...",
        "highlights": ["Led team of 3 developers", "Improved performance by 40%"]
      }
    ],
    "education": [
      {
        "institution": "University",
        "degree": "BS Computer Science",
        "details": "2014-2018",
        "status": "completed"
      }
    ],
    "skills": {
      "technical": ["JavaScript", "React", "Node.js"],
      "personal": ["Leadership", "Communication"]
    }
  }
}
```

**Frontend Check:**
- CV summary displays in "CV / Living Profile" card
- Experience shows in "Experiencia Laboral" section

---

#### 2e. Assessment Results Response
Test: `GET /recruiter/candidates/{candidateId}/assessment-results`

**Expected Response:**
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
    "duration": 3600,
    "feedback": "Excellent understanding of async/await patterns"
  },
  {
    "id": "uuid",
    "type": "psychotechnical",
    "testName": "Personality & Skills Assessment",
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

**Frontend Check:**
- "Resultado Prueba Tecnica" shows "92%"
- "Resultado Prueba Psicotecnica" shows "78%"
- Feedback displays correctly
- No errors in console

---

#### 2f. Learning Path Response
Test: `GET /recruiter/candidates/{candidateId}/learning-path`

**Expected Response:**
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
      "title": "JavaScript Fundamentals",
      "status": "completed",
      "progress": 100
    }
  ]
}
```

**Frontend Check:**
- Learning path loads without errors
- No UI crashes

---

#### 2g. Courses Response
Test: `GET /recruiter/candidates/{candidateId}/courses`

**Expected Response:**
```json
[
  {
    "id": "uuid",
    "title": "Advanced TypeScript",
    "description": "Master TypeScript for enterprise applications",
    "status": "in_progress",
    "progress": 65,
    "modules": 8,
    "completedModules": 5,
    "startedAt": "2024-12-15T09:00:00Z",
    "instructor": "Jane Smith",
    "company": "TechCorp"
  },
  {
    "id": "uuid",
    "title": "React Advanced Patterns",
    "status": "completed",
    "progress": 100,
    "modules": 6,
    "completedModules": 6
  }
]
```

**Frontend Check:**
- Courses display in "Cursos por Hacer" section
- Can click course buttons to see related completed courses

---

### Step 3: Full Flow Validation

#### Scenario 1: View Candidate List
```
1. Open CompanyDashboard
   ✓ Mock data shows initially
   ✓ Browser loads real candidates from GET /recruiter/candidates
   ✓ List updates with real data
```

#### Scenario 2: Search Candidate
```
1. Type "developer" in "Buscar por cargo" field
2. Press Enter
   ✓ GET /recruiter/candidates?title=developer called
   ✓ List filters to matching candidates
   ✓ Results show only relevant candidates
```

#### Scenario 3: View Candidate Details
```
1. Click "Mostrar detalle" on a candidate
   ✓ Detail view loads
   ✓ GET /recruiter/candidates/{id}/consolidated called (or individual endpoints)
   ✓ All data loads without errors
   ✓ Tab switches work
```

#### Scenario 4: View Skills Tab
```
1. Click "Skills Validadas" tab in detail view
   ✓ Skills load from GET /recruiter/candidates/{id}/skills
   ✓ Each skill shows with level/category
   ✓ "Validada" badge visible
```

#### Scenario 5: View CV + Results Tab
```
1. Click "CV + Resultados" tab in detail view
   ✓ CV summary loads from GET /recruiter/candidates/{id}/cv
   ✓ Technical test score shows (from assessment-results)
   ✓ Psychotechnical test score shows
   ✓ Experience section displays
   ✓ Courses section shows pending/completed
```

---

### Step 4: Error Handling Validation

#### Scenario 1: Endpoint Down
```
When GET /recruiter/candidates/{id}/skills fails:
✓ Fallback to mock data happens
✓ UI still displays (doesn't crash)
✓ Warning logged to console
✓ User can still interact
```

#### Scenario 2: Network Slow
```
When loading candidate details:
✓ "Cargando datos del candidato..." message shows
✓ After data loads, display updates
✓ No duplicate requests
```

#### Scenario 3: Empty Results
```
When search returns 0 results:
✓ Message "No encontramos candidatos..." shows
✓ Clean state, user can clear and search again
```

---

### Step 5: Browser DevTools Validation

**Network Tab:**
- [ ] No failed requests (404, 500)
- [ ] All `/recruiter/candidates/*` calls return 200
- [ ] Response times reasonable (<2s)
- [ ] No duplicate requests

**Console Tab:**
- [ ] No red errors
- [ ] Only expected warnings for fallback behavior
- [ ] No 401/403 auth errors

**Performance:**
- [ ] Detail view loads in <2 seconds
- [ ] No memory leaks (DevTools Memory snapshot)
- [ ] Smooth scrolling in candidate list

---

### Step 6: Data Consistency Validation

#### Test Case: Talent Updates Data → Recruiter Sees Updated Data
```
1. Talent updates skill level in TalentDashboard
   PATCH /skills/me/{skillId} called
   
2. Recruiter immediately views same candidate detail
   GET /recruiter/candidates/{id}/skills called
   
✓ Recruiter sees updated skill level
✓ No cache issues
```

---

## Quick Validation Script

```bash
#!/bin/bash

BASE="http://localhost:3000"
TOKEN="YOUR_JWT_TOKEN"

echo "Testing Recruiter Endpoints..."

# Test 1: List candidates
echo -e "\n1. GET /recruiter/candidates"
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE/recruiter/candidates" | jq '.[] | {id, name, title}' | head -20

# Test 2: Get one candidate
CANDIDATE_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE/recruiter/candidates" | jq -r '.[0].id')

echo -e "\n2. GET /recruiter/candidates/$CANDIDATE_ID"
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE/recruiter/candidates/$CANDIDATE_ID" | jq '.| {name, title, email}'

# Test 3: Get skills
echo -e "\n3. GET /recruiter/candidates/$CANDIDATE_ID/skills"
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE/recruiter/candidates/$CANDIDATE_ID/skills" | jq '.[] | {name, level}'

# Test 4: Get assessment results
echo -e "\n4. GET /recruiter/candidates/$CANDIDATE_ID/assessment-results"
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE/recruiter/candidates/$CANDIDATE_ID/assessment-results" | jq '.[] | {type, score}'

echo -e "\n✓ All endpoints responded"
```

---

## Troubleshooting

### Issue: "No encontramos candidatos..."
**Solution:** 
- Check if endpoint returns data: `curl http://localhost:3000/recruiter/candidates -H "Authorization: Bearer $TOKEN"`
- Verify authentication token is valid
- Check database has candidates

### Issue: "Cargando datos del candidato..." (stuck)
**Solution:**
- Check network tab for 404/500 errors
- Verify candidate ID is correct
- Check if `/recruiter/candidates/{id}` endpoint exists

### Issue: Skills show but test scores don't
**Solution:**
- Check `/recruiter/candidates/{id}/assessment-results` endpoint
- Verify test data exists in database
- Check response format matches expected structure

### Issue: UI looks wrong, data not aligned
**Solution:**
- Clear browser cache (Ctrl+Shift+Del)
- Hard refresh (Ctrl+Shift+R)
- Check console for TypeScript errors
- Verify data structure matches interfaces

---

## Rollback Plan

If endpoints are removed or changed:
1. Frontend automatically falls back to mock data
2. CompanyDashboard still displays (with sample data)
3. No UI crashes
4. Search/filter still works on mock data

---

**Last Updated:** 2025-05-19
**Frontend Version:** Ready for validation
**Backend Status:** Awaiting endpoint implementation
