# App Talen Backend

Backend construido con NestJS, TypeORM y PostgreSQL.

El objetivo de esta base es dejar preparado el proyecto para trabajar con una arquitectura modular, separando la logica de negocio de la infraestructura y dejando la base de datos modelada con entidades TypeORM.

## Que se hizo

Se organizo el backend dentro de `src/modules` usando modulos por dominio funcional:

- `auth`
- `users`
- `profiles`
- `assessment`
- `learning`
- `skills`
- `companies`
- `marketplace`

Cada modulo esta pensado con esta estructura:

```txt
module/
  domain/
  application/
  infrastructure/
```

La idea de cada capa es:

- `domain`: reglas del negocio, enums, tipos y modelos propios del dominio.
- `application`: casos de uso, servicios de aplicacion y orquestacion.
- `infrastructure`: adaptadores externos, persistencia, entidades TypeORM, repositories, controladores o integraciones.

Por ahora se crearon principalmente las entidades de persistencia dentro de:

```txt
src/modules/*/infrastructure/entities
```

## Modelo de datos

Se migro el modelo inicial a entidades TypeORM:

- `User`
- `Profile`
- `Assessment`
- `LearningPath`
- `LearningModule`
- `UserModuleProgress`
- `Skill`
- `UserSkill`
- `Company`
- `JobOpportunity`
- `CandidateApplication`
- `CompanyFeedback`

Tambien se agregaron los enums:

- `UserRole`
- `ModuleStatus`
- `ApplicationStatus`

Las relaciones principales son:

- Un `User` puede tener un `Profile` o una `Company`.
- Un `Profile` tiene assessments, rutas de aprendizaje, progreso, skills y postulaciones.
- Una `Company` publica oportunidades laborales.
- Una `JobOpportunity` recibe postulaciones de candidatos.
- Una `CandidateApplication` puede tener feedback de empresa.
- Los modulos de aprendizaje pueden estar relacionados con skills.

## Configuracion de TypeORM

La configuracion de TypeORM esta separada en:

```txt
src/config/typeorm.config.ts
```

El `AppModule` solo importa esa configuracion:

```ts
TypeOrmModule.forRoot(typeormConfig)
```

TypeORM esta configurado para PostgreSQL y toma valores desde variables de entorno:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=talent_db
TYPEORM_SYNC=true
```

`TYPEORM_SYNC=true` permite que TypeORM cree o sincronice tablas automaticamente durante desarrollo. Para produccion se recomienda usar migraciones y dejarlo en `false`.

## Docker

Se agregaron archivos para levantar el backend en contenedores:

```txt
Dockerfile
docker-compose.yml
.dockerignore
.env.example
```

El `Dockerfile` usa una estrategia multi-stage:

- Instala dependencias con `pnpm`.
- Compila el proyecto NestJS.
- Deja una imagen final solo con `dist`, `node_modules` de produccion y `package.json`.

El `docker-compose.yml` levanta dos servicios:

- `api`: backend NestJS.
- `postgres`: base de datos PostgreSQL.

Dentro de Docker, la API usa `DB_HOST=postgres`, porque ese es el nombre del servicio de base de datos dentro de la red de Docker Compose.

## Levantar con Docker

Desde esta carpeta:

```bash
cd Backend/app-talen-backend
```

Levantar API y base de datos:

```bash
docker compose up --build
```

La API queda disponible en:

```txt
http://localhost:3000
```

PostgreSQL queda disponible en:

```txt
localhost:5432
```

Credenciales por defecto:

```txt
usuario: postgres
password: postgres
base de datos: talent_db
```

## Crear solo la imagen Docker

```bash
docker build -t app-talen-backend .
```

Ejecutar la imagen creada:

```bash
docker run --name app-talen-api -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_DATABASE=talent_db \
  -e TYPEORM_SYNC=true \
  app-talen-backend
```

Si se usa Linux y `host.docker.internal` no esta disponible, conviene usar `docker compose` o pasar la IP/host real de la base de datos.

## Levantar sin Docker

Instalar dependencias:

```bash
pnpm install
```

Crear un archivo `.env` tomando como referencia `.env.example`.

Ejecutar en desarrollo:

```bash
pnpm run start:dev
```

Compilar:

```bash
pnpm run build
```

Ejecutar compilado:

```bash
pnpm run start:prod
```

## Comandos utiles

```bash
pnpm run build
pnpm run start:dev
pnpm run test
pnpm run lint
```

## Siguientes pasos sugeridos

- Crear modulos Nest reales para cada dominio.
- Agregar controllers, services y casos de uso en `application`.
- Crear repositories o providers de TypeORM en `infrastructure`.
- Reemplazar `TYPEORM_SYNC=true` por migraciones TypeORM cuando el modelo se estabilice.
- Agregar autenticacion JWT en `auth`.
- Agregar DTOs y validaciones para los endpoints.
