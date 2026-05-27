# Verificacion backend (solo lectura)

Fecha: 2026-05-26

## Resultado general

- Uso de TypeORM: confirmado.
- Compilacion backend: correcta (`npm run build` en backend).
- Login backend: correcto (genera `accessToken`).
- Crear vacante con payload minimo: correcto.
- Crear vacante con payload extendido (area/salaryMin/salaryMax/contractType/seniority/responsibilities/optionalSkills): falla con `400 Bad Request`.

## Evidencia de smoke test

```text
TypeORM         : Detected
Build           : OK
Login           : OK
MinimalVacancy  : OK
ExtendedVacancy : FAIL
ExtendedError   : Error en el servidor remoto: (400) Solicitud incorrecta.
```

## Conclusión

El backend funciona bien en su contrato actual y sí usa TypeORM.
El único punto no íntegro frente al formulario extendido del frontend es el contrato de creación de vacantes para campos adicionales.
