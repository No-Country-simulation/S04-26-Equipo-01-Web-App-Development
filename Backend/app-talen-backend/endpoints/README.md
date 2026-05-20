# Endpoints

Esta carpeta sirve para documentar y probar manualmente los endpoints del backend.

Los archivos `.http` pueden ejecutarse desde VS Code usando la extension REST Client, o copiarse facilmente a Postman/Insomnia.

## Archivos

- `auth.http`: endpoints ya implementados de registro y login.
- `users.http`: espacio para endpoints del modulo users.
- `profiles.http`: espacio para endpoints del modulo profiles.
- `assessment.http`: espacio para endpoints del modulo assessment.
- `learning.http`: espacio para endpoints del modulo learning.
- `skills.http`: espacio para endpoints del modulo skills.
- `companies.http`: espacio para endpoints del modulo companies.
- `marketplace.http`: espacio para endpoints del modulo marketplace.

- `courses.http`: espacio para endpoints del modulo courses (CRUD, módulos, enlaces de reunión, aprobación).

## Uso

Levantar el backend:

```bash
pnpm run start:dev
```

O con Docker:

```bash
docker compose up --build
```

La variable base usada por los archivos es:

```http
@baseUrl = http://localhost:3001
```

Cuando un endpoint requiera autenticacion, primero ejecutar login o register y copiar el JWT en:

```http
@accessToken = token

## Notas sobre `courses`

- `GET /courses`: los usuarios con rol `TALENT` solo verán cursos en estado `PUBLISHED`. Otros roles (COMPANY, ADMIN) podrán ver más resultados según permisos y el query param `?published=true`.
- Flujo de publicación: las empresas no pueden publicar directamente. Pueden crear o actualizar un curso con estado `PENDING_REVIEW` para solicitar publicación. Un `ADMIN` debe aprobar el curso mediante `POST /courses/:courseId/approve` para cambiar el estado a `PUBLISHED`.

Se recomienda usar los archivos `.http` correspondientes para probar cada endpoint y actualizar `@accessToken` tras autenticarse.
```
