# Hoja de Configuracion de Deploy

Fecha base: 2026-05-21
Proyecto: appTalenFront
Objetivo: checklist de configuracion para revisar deploy existente en Vercel (Frontend), Render (Backend) y Supabase (Database/Auth/Storage).

## 1) Arquitectura objetivo

- Frontend (Vercel): React + Vite, build estatico.
- Backend (Render): API REST (Node/Nest/Express).
- Database (Supabase): Postgres + (opcional) Auth/Storage.
- Flujo recomendado de red:
  - Produccion: Frontend llama por URL absoluta al Backend (Render).
  - Desarrollo local: Frontend puede usar proxy de Vite a localhost.

## 2) Frontend en Vercel

Codigo relevante actual:
- Build command: npm run build
- Output directory: dist
- Cliente API: src/feactures/api/axiosInterface.ts usa VITE_API_URL o /api
- Proxy local de Vite: vite.config.ts (solo aplica en dev local)

### Configuracion recomendada en Vercel

- Framework preset: Vite
- Install command: npm ci
- Build command: npm run build
- Output directory: dist
- Node version: 20.x (recomendado estable)

### Variables de entorno en Vercel

Definir al menos:
- VITE_API_URL=https://TU_BACKEND_RENDER.onrender.com

Notas:
- No usar /api en produccion si no configuraste rewrites proxy en Vercel.
- El proxy de vite.config.ts NO corre en Vercel. Solo corre al usar npm run dev.

### Rewrites para SPA (si aplica)

Si tienes problemas de refresh en rutas (por ejemplo /dashboard), agregar vercel.json:

{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}

## 3) Backend en Render

### Servicio Web

- Runtime: Node
- Build command (ejemplo): npm ci && npm run build
- Start command (ejemplo): npm run start:prod o node dist/main.js
- Health endpoint recomendado: /health

### Variables de entorno recomendadas en Render

- NODE_ENV=production
- PORT=10000 (Render lo inyecta normalmente)
- DATABASE_URL=<connection string de Supabase>
- JWT_SECRET=<secreto fuerte>
- CORS_ORIGIN=https://TU_FRONTEND.vercel.app

Opcionales:
- SUPABASE_URL=<proyecto supabase>
- SUPABASE_SERVICE_ROLE_KEY=<solo backend, nunca frontend>
- LOG_LEVEL=info

### CORS

Debe permitir:
- Origin de Vercel (dominio principal y preview si se usa)
- Metodos: GET, POST, PATCH, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization

## 4) Supabase

### Base de datos

- Verificar que Render use la cadena correcta (pooler o direct) segun ORM.
- Aplicar migraciones de esquema antes de validar endpoints.
- Revisar indices en tablas de alto trafico (usuarios, assessments, skills, learning).

### Seguridad

- Rotar claves comprometidas.
- Nunca exponer SERVICE_ROLE_KEY en frontend.
- Si se usa RLS, revisar politicas de lectura/escritura por rol.

### Storage (si hay CV o archivos)

- Bucket privado para CV.
- URLs firmadas desde backend.
- Limites de tipo y tamano de archivo.

## 5) Endpoints criticos a validar post-deploy

Auth:
- POST /auth/register
- POST /auth/login

Assessment (pruebas):
- GET /assessments/technical-tests/questions
- GET /assessments/psychotechnical-tests/questions
- POST /assessments/me/technical-tests/submit
- POST /assessments/me/psychotechnical-tests/submit

Learning/Cursos:
- GET /learning-paths/me (si backend lo expone)
- GET /learning-modules/me (si backend lo expone)
- Fallback operativo actual en frontend: /recruiter/candidates/{userId}/learning-path y /courses

Recruiter:
- GET /recruiter/candidates
- GET /recruiter/candidates/{candidateId}/consolidated
- GET /recruiter/vacancies

## 6) Smoke test minimo despues de cada deploy

1. Frontend carga en Vercel sin errores JS fatales.
2. Login y registro responden 200/201.
3. Prueba tecnica abre preguntas y envia submit.
4. Prueba psicotecnica abre preguntas y envia submit.
5. Dashboard recruiter lista candidatos.
6. Seccion cursos abre tabs sin crash (aunque haya estado vacio).

## 7) Checklist de revision rapida

Frontend Vercel:
- [ ] VITE_API_URL apunta a Render
- [ ] Build en verde
- [ ] Rewrite SPA funcionando

Backend Render:
- [ ] CORS permite dominio Vercel
- [ ] Variables de entorno completas
- [ ] Health check en verde
- [ ] Endpoints criticos responden

Supabase:
- [ ] DATABASE_URL correcta en Render
- [ ] Migraciones aplicadas
- [ ] RLS/roles revisados
- [ ] Secretos no expuestos al cliente

## 8) Riesgos comunes

- Usar /api en produccion sin proxy real en Vercel.
- CORS bloqueando Authorization desde frontend.
- Diferencias entre endpoint documentado y endpoint realmente desplegado.
- Variables en entorno local correctas pero faltantes en Vercel/Render.

## 9) Recomendacion operativa

- Mantener un archivo .env.example versionado con variables requeridas.
- Mantener una coleccion de pruebas API (Postman/Insomnia) para smoke test.
- Ejecutar checklist de seccion 7 en cada release.
