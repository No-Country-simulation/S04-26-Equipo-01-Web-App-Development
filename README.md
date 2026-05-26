# App Talen

App Talen es una plataforma web para conectar talento, empresas y formacion profesional. El proyecto esta organizado como monorepo con una aplicacion frontend en React y un backend en NestJS con PostgreSQL.

## Contenido

- [Stack tecnico](#stack-tecnico)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Primeros pasos](#primeros-pasos)
- [Variables de entorno](#variables-de-entorno)
- [Levantar con Docker](#levantar-con-docker)
- [Levantar en desarrollo local](#levantar-en-desarrollo-local)
- [Rutas principales](#rutas-principales)
- [Comandos utiles](#comandos-utiles)
- [Documentacion adicional](#documentacion-adicional)

## Stack tecnico

Frontend:

- React 19
- TypeScript
- Vite
- Material UI
- React Router
- Axios

Backend:

- NestJS 11
- TypeScript
- TypeORM
- PostgreSQL
- JWT
- Swagger
- pnpm

Infraestructura local:

- Docker Compose
- PostgreSQL 16
- Nginx para servir el build del frontend

## Estructura del repositorio

```txt
.
├── Backend/
│   └── app-talen-backend/       # API NestJS
│       ├── src/modules/         # Modulos por dominio
│       ├── endpoints/           # Colecciones .http para pruebas manuales
│       ├── Dockerfile
│       └── README.md
├── Frontend/
│   └── appTalenFront/           # App React + Vite
│       ├── src/components/
│       ├── src/feactures/
│       ├── src/services/
│       ├── src/types/
│       ├── Dockerfile
│       └── README.md
├── docs/                        # Guias tecnicas y de validacion
├── docker-compose.yml           # Stack completo
└── .env.example                 # Variables de entorno de referencia
```

## Primeros pasos

Requisitos recomendados:

- Node.js 22
- npm, para el frontend
- pnpm 10, para el backend
- Docker y Docker Compose, si se usa el entorno containerizado

Crear el archivo de entorno:

```bash
cp .env.example .env
```

Revisar `.env` antes de levantar el proyecto. En desarrollo local, el backend expone la API sin prefijo global, por ejemplo `http://localhost:3000/auth/login`.

## Variables de entorno

Variables principales:

```env
PORT=3000
CORS_ORIGIN=*
DB_HOST=postgres
DB_PORT=5434
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=talent_db
TYPEORM_SYNC=true
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=7d
VITE_API_URL=http://localhost:3000
```

Tambien existen variables opcionales para OAuth:

```env
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Nota: `TYPEORM_SYNC=true` es util en desarrollo porque sincroniza tablas automaticamente. Para produccion conviene usar migraciones y dejarlo en `false`.

## Levantar con Docker

Desde la raiz del repositorio:

```bash
docker compose up --build
```

El build del frontend toma `VITE_API_URL` desde `.env` y lo incorpora en los archivos estaticos generados por Vite.

Servicios esperados:

| Servicio | URL local |
| --- | --- |
| Frontend | `http://localhost:8080` |
| Backend API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| PostgreSQL | `localhost:5434` |

Para detener los servicios:

```bash
docker compose down
```

Para eliminar tambien el volumen de base de datos:

```bash
docker compose down -v
```

## Levantar en desarrollo local

### Backend

```bash
cd Backend/app-talen-backend
pnpm install
pnpm run start:dev
```

La API queda disponible en `http://localhost:3000` y Swagger en `http://localhost:3000/docs`.

### Frontend

```bash
cd Frontend/appTalenFront
npm install
npm run dev
```

Vite informa la URL local, normalmente `http://localhost:5173`.

Configurar el frontend para consumir el backend:

```env
VITE_API_URL=http://localhost:3000
```

## Rutas principales

Frontend:

| Ruta | Descripcion |
| --- | --- |
| `/` | Landing page |
| `/login` | Inicio de sesion |
| `/register` | Registro |
| `/dashboard` | Dashboard segun rol: talento, empresa o admin |
| `/academia` | Academia Pro |

Backend:

| Modulo | Base path |
| --- | --- |
| Auth | `/auth` |
| Profiles | `/profiles` |
| Skills | `/skills` |
| Assessments | `/assessments` |
| Learning | `/learning-paths`, `/learning-modules` |
| Recruiter marketplace | `/recruiter` |
| Courses | `/courses` |

La documentacion interactiva de endpoints esta en Swagger: `http://localhost:3000/docs`.

## Comandos utiles

Frontend:

```bash
cd Frontend/appTalenFront
npm run dev
npm run lint
npm run build
```

Backend:

```bash
cd Backend/app-talen-backend
pnpm run start:dev
pnpm run lint
pnpm run test
pnpm run build
```

Docker:

```bash
docker compose up --build
docker compose down
docker compose down -v
```

## Documentacion adicional

- [Backend](Backend/app-talen-backend/README.md)
- [Frontend](Frontend/appTalenFront/README.md)
- [Indice de docs](docs/README.md)
- [Endpoints manuales REST Client](Backend/app-talen-backend/endpoints/README.md)
- [Configuracion de deploy](docs/DEPLOY_CONFIGURATION_VERCEL_RENDER_SUPABASE.md)
- [Flujo talento a reclutador](docs/DATA_FLOW_TALENT_TO_RECRUITER.md)
