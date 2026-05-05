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
```
