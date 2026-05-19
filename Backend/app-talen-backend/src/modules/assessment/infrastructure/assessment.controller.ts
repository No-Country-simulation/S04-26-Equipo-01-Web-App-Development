import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../auth/infrastructure/types/authenticated-request.type';
import { AssessmentService } from '../application/assessment.service';
import { CreateAssessmentTestDto } from '../application/dto/create-assessment-test.dto';
import { CreateAssessmentDto } from '../application/dto/create-assessment.dto';
import {
  AssessmentTestQuestionDto,
  GeneratedTestsResponseDto,
} from '../application/dto/generated-tests-response.dto';
import { SubmitAssessmentTestDto } from '../application/dto/submit-assessment-test.dto';
import { AssessmentTestQuestion } from '../domain/assessment-test-question.type';
import { AssessmentTestResultEntity } from './entities/assessment-test-result.entity';
import { Assessment } from './entities/assessment.entity';

@ApiTags('Evaluaciones')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'No autenticado.' })
@ApiForbiddenResponse({
  description: 'El usuario no tiene permisos para acceder a evaluaciones.',
})
@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('me')
  @ApiOperation({
    summary: 'Crear evaluación personal',
    description: 'Crea una nueva evaluación para el usuario autenticado.',
  })
  @ApiBody({
    type: CreateAssessmentDto,
    description: 'Datos para crear la evaluación.',
  })
  @ApiResponse({
    status: 201,
    description: 'Evaluación creada.',
    type: Assessment,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de evaluación inválidos.',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: 'digitalLevel must be one of: basic, intermediate, advanced',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token invalido o ausente.' })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden crear evaluaciones.',
  })
  createMe(
    @Req() request: AuthenticatedRequest,
    @Body() createAssessmentDto: CreateAssessmentDto,
  ): Promise<Assessment> {
    return this.assessmentService.createMe(request.user, createAssessmentDto);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Listar mis evaluaciones',
    description:
      'Devuelve todas las evaluaciones realizadas por el usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de evaluaciones.',
    type: [Assessment],
  })
  @ApiUnauthorizedResponse({ description: 'Token invalido o ausente.' })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden listar evaluaciones.',
  })
  findMine(@Req() request: AuthenticatedRequest): Promise<Assessment[]> {
    return this.assessmentService.findMine(request.user);
  }

  @Get('me/latest')
  @ApiOperation({
    summary: 'Obtener mi última evaluación',
    description: 'Devuelve la evaluación más reciente del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Última evaluación.',
    type: Assessment,
  })
  @ApiUnauthorizedResponse({ description: 'Token invalido o ausente.' })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden consultar evaluaciones.',
  })
  findMyLatest(@Req() request: AuthenticatedRequest): Promise<Assessment> {
    return this.assessmentService.findMyLatest(request.user);
  }

  @Post('me/consolidate')
  @ApiOperation({
    summary: 'Generar evaluacion consolidada',
    description:
      'Consolida los resultados de pruebas tecnicas y psicotecnicas para crear una evaluacion integral del perfil.',
  })
  @ApiResponse({
    status: 201,
    description: 'Evaluacion consolidada creada.',
    type: Assessment,
  })
  @ApiResponse({
    status: 400,
    description:
      'No se puede consolidar la evaluación con el estado actual de los tests.',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message:
            'No test results found. Complete at least one psychotechnical and one technical test first.',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token invalido o ausente.' })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden consolidar evaluaciones.',
  })
  consolidateMyAssessment(
    @Req() request: AuthenticatedRequest,
  ): Promise<Assessment> {
    return this.assessmentService.consolidateMyAssessment(request.user);
  }

  @Get('psychotechnical-tests/questions')
  @ApiOperation({
    summary: 'Preguntas de test psicotécnicos',
    description: 'Obtiene el listado de preguntas para el test psicotécnicos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Preguntas del test psicotécnicos.',
    type: [AssessmentTestQuestionDto],
  })
  @ApiUnauthorizedResponse({ description: 'Token invalido o ausente.' })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden consultar preguntas.',
  })
  getPsychotechnicalQuestions(): AssessmentTestQuestion[] {
    return this.assessmentService.getPsychotechnicalQuestions();
  }
  @Post('me/generate-tests')
  @ApiOperation({
    summary: 'Generar tests basados en el perfil',
    description:
      'Genera tests psicotecnicos y tecnicos automaticamente basados en el perfil del usuario.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tests generados exitosamente.',
    type: GeneratedTestsResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Token invalido o ausente.' })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden generar tests.',
  })
  async generateTestsForProfile(
    @Req() request: AuthenticatedRequest,
  ): Promise<GeneratedTestsResponseDto> {
    return this.assessmentService.generateTestsForProfile(request.user);
  }

  @Get('technical-tests/questions')
  @ApiOperation({
    summary: 'Preguntas de test técnico',
    description: 'Obtiene el listado de preguntas para el test técnico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Preguntas del test técnico.',
    type: [AssessmentTestQuestionDto],
  })
  @ApiUnauthorizedResponse({ description: 'Token invalido o ausente.' })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden consultar preguntas.',
  })
  getTechnicalQuestions(): AssessmentTestQuestion[] {
    return this.assessmentService.getTechnicalQuestions();
  }

  @Post('me/psychotechnical-tests/submit')
  @ApiOperation({
    summary: 'Enviar respuestas de test psicotécnicos',
    description: 'Envía las respuestas del usuario para el test psicotécnicos.',
  })
  @ApiBody({
    type: SubmitAssessmentTestDto,
    description: 'Respuestas del test psicotécnicos.',
  })
  @ApiResponse({
    status: 201,
    description: 'Resultado del test psicotécnicos.',
    type: AssessmentTestResultEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Respuestas del test psicotécnicos inválidas.',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: 'Missing answer for question psy_logic_1',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token invalido o ausente.' })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden enviar resultados de tests.',
  })
  submitMyPsychotechnicalTest(
    @Req() request: AuthenticatedRequest,
    @Body() submitAssessmentTestDto: SubmitAssessmentTestDto,
  ): Promise<AssessmentTestResultEntity> {
    return this.assessmentService.submitMyPsychotechnicalTest(
      request.user,
      submitAssessmentTestDto,
    );
  }

  @Post('me/technical-tests/submit')
  @ApiOperation({
    summary: 'Enviar respuestas de test técnico',
    description: 'Envía las respuestas del usuario para el test técnico.',
  })
  @ApiBody({
    type: SubmitAssessmentTestDto,
    description: 'Respuestas del test técnico.',
  })
  @ApiResponse({
    status: 201,
    description: 'Resultado del test técnico.',
    type: AssessmentTestResultEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Respuestas del test técnico inválidas.',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: 'Invalid question tech_invalid_1',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token invalido o ausente.' })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden enviar resultados de tests.',
  })
  submitMyTechnicalTest(
    @Req() request: AuthenticatedRequest,
    @Body() submitAssessmentTestDto: SubmitAssessmentTestDto,
  ): Promise<AssessmentTestResultEntity> {
    return this.assessmentService.submitMyTechnicalTest(
      request.user,
      submitAssessmentTestDto,
    );
  }

  @Post('me/psychotechnical-tests')
  @ApiOperation({
    summary: 'Crear resultado de test psicotécnicos',
    description: 'Crea un nuevo resultado para el test psicotécnicos.',
  })
  @ApiBody({
    type: CreateAssessmentTestDto,
    description: 'Datos del resultado del test psicotécnicos.',
  })
  @ApiResponse({
    status: 201,
    description: 'Resultado creado.',
    type: AssessmentTestResultEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Resultado del test psicotécnicos inválido.',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: 'Score cannot be greater than maxScore',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token invalido o ausente.' })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden crear resultados.',
  })
  createMyPsychotechnicalTestResult(
    @Req() request: AuthenticatedRequest,
    @Body() createAssessmentTestDto: CreateAssessmentTestDto,
  ): Promise<AssessmentTestResultEntity> {
    return this.assessmentService.createMyPsychotechnicalTestResult(
      request.user,
      createAssessmentTestDto,
    );
  }

  @Post('me/technical-tests')
  @ApiOperation({
    summary: 'Crear resultado de test técnico',
    description: 'Crea un nuevo resultado para el test técnico.',
  })
  @ApiBody({
    type: CreateAssessmentTestDto,
    description: 'Datos del resultado del test técnico.',
  })
  @ApiResponse({
    status: 201,
    description: 'Resultado creado.',
    type: AssessmentTestResultEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Resultado del test técnico inválido.',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: 'Score cannot be greater than maxScore',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token invalido o ausente.' })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden crear resultados.',
  })
  createMyTechnicalTestResult(
    @Req() request: AuthenticatedRequest,
    @Body() createAssessmentTestDto: CreateAssessmentTestDto,
  ): Promise<AssessmentTestResultEntity> {
    return this.assessmentService.createMyTechnicalTestResult(
      request.user,
      createAssessmentTestDto,
    );
  }

  @Get('me/test-results')
  @ApiOperation({
    summary: 'Listar mis resultados de tests',
    description:
      'Devuelve todos los resultados de tests del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de resultados.',
    type: [AssessmentTestResultEntity],
  })
  @ApiUnauthorizedResponse({ description: 'Token invalido o ausente.' })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden consultar resultados.',
  })
  findMyTestResults(
    @Req() request: AuthenticatedRequest,
  ): Promise<AssessmentTestResultEntity[]> {
    return this.assessmentService.findMyTestResults(request.user);
  }

  @Get('me/test-results/latest')
  @ApiOperation({
    summary: 'Obtener mis últimos resultados de tests',
    description:
      'Devuelve los resultados más recientes de los tests del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Últimos resultados.',
    type: [AssessmentTestResultEntity],
  })
  @ApiUnauthorizedResponse({ description: 'Token invalido o ausente.' })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden consultar resultados.',
  })
  findMyLatestTestResults(
    @Req() request: AuthenticatedRequest,
  ): Promise<AssessmentTestResultEntity[]> {
    return this.assessmentService.findMyLatestTestResults(request.user);
  }
}
