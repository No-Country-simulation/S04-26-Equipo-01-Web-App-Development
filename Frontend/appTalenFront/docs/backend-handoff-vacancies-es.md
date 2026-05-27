# Handoff Backend: Vacantes (Area, Salarios, Descripcion)

Este documento es para compartir con backend y cerrar el flujo completo de vacantes.

## Objetivo

Garantizar que estos campos se guarden en BD y regresen en el GET:

- area
- salaryMin
- salaryMax
- description
- responsibilities
- optionalSkills
- contractType
- seniority

## Referencia de contrato

Usar como fuente oficial:

- [backend-vacancy-contract.md](backend-vacancy-contract.md)
- [backend-nestjs-vacancies-patch.md](backend-nestjs-vacancies-patch.md)

## Mensaje sugerido para backend (copiar/pegar)

Hola equipo,

Frontend ya envia y consume los campos extendidos de vacantes en Company Dashboard.
Necesitamos su soporte en backend para persistencia y respuesta completa.

Por favor implementar en:

1. POST /recruiter/vacancies
2. GET /recruiter/vacancies

Campos requeridos:
- title
- area
- modality
- location
- contractType
- seniority
- vacancies
- salaryMin
- salaryMax
- description
- responsibilities[]
- requiredSkills[]
- optionalSkills[]

Detalles tecnicos y migracion sugerida en:
- docs/backend-vacancy-contract.md

Criterio de aceptacion:
1. Se crea vacante con esos campos.
2. Se listan con GET sin perder valores.
3. Al recargar frontend, "Cargar vacante existente" muestra area/salarios/descripcion correctamente.

Gracias.

## Evidencia esperada de backend

- PR o commit con:
  - DTO actualizado
  - Entidad/modelo actualizado
  - Mapper actualizado (response)
  - migracion BD
  - tests de create/list

## Criterio de cierre funcional

- Crear vacante desde UI con area + salarios + descripcion.
- Refrescar pagina.
- Seleccionar la vacante en "Cargar vacante existente".
- Verificar que los campos se repueblan con los mismos valores.

## Evidencia tecnica observada (2026-05-26)

Conexion y autenticacion OK, pero el backend rechaza campos extendidos en POST /recruiter/vacancies.

Respuesta real:

```json
{
  "message": [
    "property responsibilities should not exist",
    "property salaryMin should not exist",
    "property seniority should not exist",
    "property optionalSkills should not exist",
    "property contractType should not exist",
    "property area should not exist",
    "property salaryMax should not exist"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

Esto confirma que falta actualizar DTO/validation pipe/whitelist en backend para aceptar estos campos.
