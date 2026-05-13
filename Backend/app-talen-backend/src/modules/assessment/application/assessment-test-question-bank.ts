import { ScoredAssessmentTestQuestion } from '../domain/assessment-test-question.type';

export const psychotechnicalQuestions: ScoredAssessmentTestQuestion[] = [
  {
    id: 'psy_logic_1',
    text: 'Si todos los proyectos requieren organizacion y algunos proyectos requieren trabajo en equipo, cual afirmacion es mas precisa?',
    category: 'logical_reasoning',
    type: 'single_choice',
    score: 20,
    correctAnswer: 'b',
    options: [
      { value: 'a', label: 'Todos los trabajos en equipo son proyectos' },
      {
        value: 'b',
        label: 'Algunos proyectos pueden requerir trabajo en equipo',
      },
      { value: 'c', label: 'Ningun proyecto requiere trabajo en equipo' },
    ],
  },
  {
    id: 'psy_attention_1',
    text: 'Que opcion mantiene mejor la secuencia: A1, B2, C3, D4, ?',
    category: 'attention_to_detail',
    type: 'single_choice',
    score: 20,
    correctAnswer: 'c',
    options: [
      { value: 'a', label: 'E6' },
      { value: 'b', label: 'F5' },
      { value: 'c', label: 'E5' },
    ],
  },
  {
    id: 'psy_decision_1',
    text: 'Tenes dos tareas urgentes y poco tiempo. Cual seria la mejor primera accion?',
    category: 'decision_making',
    type: 'single_choice',
    score: 20,
    correctAnswer: 'a',
    options: [
      {
        value: 'a',
        label: 'Priorizar por impacto y avisar si hay riesgo de demora',
      },
      { value: 'b', label: 'Hacer ambas a la vez sin comunicar bloqueos' },
      { value: 'c', label: 'Elegir una al azar para empezar rapido' },
    ],
  },
  {
    id: 'psy_teamwork_1',
    text: 'Un companero propone una solucion distinta a la tuya. Que respuesta es mas colaborativa?',
    category: 'teamwork',
    type: 'single_choice',
    score: 20,
    correctAnswer: 'b',
    options: [
      { value: 'a', label: 'Defender tu solucion sin revisar la alternativa' },
      {
        value: 'b',
        label: 'Comparar ventajas, riesgos y elegir con criterios claros',
      },
      { value: 'c', label: 'Aceptar la otra solucion para evitar conversar' },
    ],
  },
  {
    id: 'psy_adaptability_1',
    text: 'Si cambian los requisitos de una tarea, cual conducta muestra mejor adaptabilidad?',
    category: 'adaptability',
    type: 'single_choice',
    score: 20,
    correctAnswer: 'c',
    options: [
      { value: 'a', label: 'Continuar igual porque ya habia un plan' },
      { value: 'b', label: 'Esperar sin avanzar hasta tener certeza total' },
      {
        value: 'c',
        label:
          'Revisar prioridades, ajustar el plan y validar el nuevo alcance',
      },
    ],
  },
];

export const technicalQuestions: ScoredAssessmentTestQuestion[] = [
  {
    id: 'tech_api_1',
    text: 'Que metodo HTTP se usa normalmente para crear un recurso?',
    category: 'api_design',
    type: 'single_choice',
    score: 20,
    correctAnswer: 'b',
    options: [
      { value: 'a', label: 'GET' },
      { value: 'b', label: 'POST' },
      { value: 'c', label: 'DELETE' },
    ],
  },
  {
    id: 'tech_db_1',
    text: 'Que significa una relacion many-to-one en TypeORM?',
    category: 'database',
    type: 'single_choice',
    score: 20,
    correctAnswer: 'a',
    options: [
      {
        value: 'a',
        label: 'Muchos registros de una entidad se relacionan con uno de otra',
      },
      { value: 'b', label: 'Un registro se duplica automaticamente' },
      { value: 'c', label: 'Dos tablas no tienen relacion entre si' },
    ],
  },
  {
    id: 'tech_auth_1',
    text: 'Que informacion deberia incluir el payload JWT de este proyecto?',
    category: 'auth',
    type: 'single_choice',
    score: 20,
    correctAnswer: 'c',
    options: [
      { value: 'a', label: 'Password y email' },
      { value: 'b', label: 'Solo fecha de creacion' },
      { value: 'c', label: 'userId y role' },
    ],
  },
  {
    id: 'tech_validation_1',
    text: 'Para que sirve ValidationPipe en NestJS?',
    category: 'validation',
    type: 'single_choice',
    score: 20,
    correctAnswer: 'b',
    options: [
      { value: 'a', label: 'Para conectar automaticamente a Postgres' },
      { value: 'b', label: 'Para validar y transformar datos de entrada' },
      { value: 'c', label: 'Para generar tokens JWT' },
    ],
  },
  {
    id: 'tech_security_1',
    text: 'Como deberia almacenarse una contrasena?',
    category: 'security',
    type: 'single_choice',
    score: 20,
    correctAnswer: 'a',
    options: [
      { value: 'a', label: 'Hasheada con bcrypt o equivalente' },
      { value: 'b', label: 'En texto plano para facilitar login' },
      { value: 'c', label: 'Dentro del JWT' },
    ],
  },
];
