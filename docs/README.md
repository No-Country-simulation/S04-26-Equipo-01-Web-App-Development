# Documentacion del proyecto

Este directorio agrupa guias tecnicas, checklists y notas de implementacion de App Talen.

## Lectura recomendada

Para empezar:

1. [README principal](../README.md): instalacion, ejecucion y mapa general del repo.
2. [Backend README](../Backend/app-talen-backend/README.md): arquitectura NestJS, TypeORM, autenticacion y Docker del backend.
3. [Frontend README](../Frontend/appTalenFront/README.md): estructura, rutas y comandos del frontend.
4. [Endpoints manuales](../Backend/app-talen-backend/endpoints/README.md): uso de archivos `.http` para probar la API.

## Guias disponibles

| Documento | Proposito |
| --- | --- |
| [BACKEND_IMPLEMENTATION_GUIDE.md](BACKEND_IMPLEMENTATION_GUIDE.md) | Guia de implementacion y patrones del backend. |
| [DATA_FLOW_TALENT_TO_RECRUITER.md](DATA_FLOW_TALENT_TO_RECRUITER.md) | Flujo de datos entre talento y reclutador. |
| [DEPLOY_CONFIGURATION_VERCEL_RENDER_SUPABASE.md](DEPLOY_CONFIGURATION_VERCEL_RENDER_SUPABASE.md) | Configuracion sugerida para deploy con Vercel, Render y Supabase. |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Resumen de implementacion y estado historico de integraciones. |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Referencia rapida del flujo frontend-backend. |
| [RECRUITER_API_ENDPOINTS.md](RECRUITER_API_ENDPOINTS.md) | Endpoints esperados para reclutadores. |
| [RECRUITER_BACKEND_IMPLEMENTATION.md](RECRUITER_BACKEND_IMPLEMENTATION.md) | Detalle de implementacion backend para marketplace/recruiter. |
| [VALIDATION_CHECKLIST.md](VALIDATION_CHECKLIST.md) | Checklist de validacion funcional. |
| [VALIDATION_CHECKLIST_COMPLETE.md](VALIDATION_CHECKLIST_COMPLETE.md) | Checklist extendido de validacion. |

## Estado de la documentacion

Algunos documentos de esta carpeta describen estados de implementacion de un momento puntual. Para confirmar el estado actual de la API, usar siempre:

- El codigo fuente en `Backend/app-talen-backend/src/modules`.
- Swagger en `http://localhost:3000/docs` con el backend levantado.
- Los archivos `.http` en `Backend/app-talen-backend/endpoints`.

## Convenciones utiles

- Backend local: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Frontend local con Vite: `http://localhost:5173`
- Frontend con Docker Compose: `http://localhost:8080`
- PostgreSQL local desde Docker Compose: `localhost:5434`
