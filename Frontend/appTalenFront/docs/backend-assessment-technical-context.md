# Backend Contract: Technical Test Generation Context

Fecha: 2026-05-28

## Objetivo

Hacer que la prueba tecnica del talento se genere usando:

- `technicalSkills` del perfil
- `professionalArea` o `headline`
- `interestedRoles` como contexto adicional

Frontend ya envia ese contexto y mantiene compatibilidad con el contrato anterior si backend todavia no lo soporta.

## Endpoint principal

### POST `/assessments/me/generate-tests`

Debe aceptar payload vacio o contextual.

### Request DTO sugerido

```ts
interface GenerateTestsForProfileDto {
  technicalSkills?: string[];
  professionalArea?: string;
  headline?: string;
  interestedRoles?: string[];
}
```

## Regla funcional esperada

- Si `technicalSkills` tiene datos, las pruebas tecnicas deben priorizar preguntas alineadas con esas skills.
- Si `professionalArea` o `headline` tiene datos, deben usarse para refinar el enfoque de la prueba.
- Si no llega contexto, backend debe seguir funcionando con el comportamiento actual.
- Si llega contexto parcial, backend debe usar lo disponible sin fallar.

## Endpoint secundario recomendado

### GET `/assessments/technical-tests/questions`

Compatibilidad recomendada con query params:

- `technicalSkills=React,TypeScript,Node.js`
- `professionalArea=Frontend Developer`
- `headline=Frontend Developer React`
- `interestedRoles=Frontend Developer,Fullstack Developer`

Esto permite que el frontend use un fallback contextual si la generacion principal falla.

## Respuesta esperada

La respuesta actual puede mantenerse, pero se recomienda enriquecer el bloque `profile` para trazabilidad:

```ts
interface GeneratedTestsResponseDto {
  psychotechnicalTests: GeneratedTest[];
  technicalTests: GeneratedTest[];
  totalTests: number;
  profile: {
    fullName: string;
    technicalSkillsCount: number;
    totalQuestionsCount: number;
    professionalArea?: string;
  };
}
```

## Criterios de aceptacion

1. Talento con skills `React`, `TypeScript` y area `Frontend Developer` recibe prueba tecnica orientada a frontend.
2. Talento con `Java`, `SQL` y area `Backend Developer` recibe prueba tecnica orientada a backend.
3. Si no hay skills guardadas, backend responde sin `500` y puede caer a preguntas generales.
4. El contrato anterior sin payload sigue siendo valido.

## Nota de compatibilidad frontend

Frontend implementado:

- envia contexto tecnico en `POST /assessments/me/generate-tests`
- intenta fallback legacy con payload vacio si backend rechaza campos nuevos
- usa fallback contextual con `GET /assessments/technical-tests/questions` si la generacion principal falla

## Recomendacion tecnica backend

- Añadir DTO con propiedades opcionales.
- No romper requests legacy con body vacio.
- Mapear skills/area a categorias o tags de preguntas.
- Agregar tests de integracion para contexto frontend y flujo legacy.