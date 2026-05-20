import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../auth/infrastructure/types/authenticated-request.type';
import { AssessmentService } from '../application/assessment.service';
import { CreateAssessmentTestDto } from '../application/dto/create-assessment-test.dto';
import { CreateAssessmentDto } from '../application/dto/create-assessment.dto';
import { SubmitAssessmentTestDto } from '../application/dto/submit-assessment-test.dto';
import { GeneratedTestsResponseDto } from '../application/dto/generated-tests-response.dto';
import { AssessmentTestQuestion } from '../domain/assessment-test-question.type';
import { AssessmentTestResultEntity } from './entities/assessment-test-result.entity';
import { Assessment } from './entities/assessment.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Evaluaciones')
@ApiBearerAuth()
@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('me')
  @ApiOperation({
    summary: 'Crear evaluaciÃ³n personal',
    description: 'Crea una nueva evaluaciÃ³n para el usuario autenticado.',
  })
  @ApiBody({
    type: CreateAssessmentDto,
    description: 'Datos para crear la evaluaciÃ³n.',
  })
  @ApiResponse({
    status: 201,
    description: 'EvaluaciÃ³n creada.',
    type: Assessment,
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
  findMine(@Req() request: AuthenticatedRequest): Promise<Assessment[]> {
    return this.assessmentService.findMine(request.user);
  }

  @Get('me/latest')
  @ApiOperation({
    summary: 'Obtener mi Ãºltima evaluaciÃ³n',
    description:
      'Devuelve la evaluaciÃ³n mÃ¡s reciente del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ãšltima evaluaciÃ³n.',
    type: Assessment,
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
  consolidateMyAssessment(
    @Req() request: AuthenticatedRequest,
  ): Promise<Assessment> {
    return this.assessmentService.consolidateMyAssessment(request.user);
  }

  @Get('psychotechnical-tests/questions')
  @ApiOperation({
    summary: 'Preguntas de test psicotÃ©cnico',
    description: 'Obtiene el listado de preguntas para el test psicotÃ©cnico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Preguntas del test psicotÃ©cnico.',
    type: [Object],
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
  async generateTestsForProfile(
    @Req() request: AuthenticatedRequest,
  ): Promise<GeneratedTestsResponseDto> {
    return this.assessmentService.generateTestsForProfile(request.user);
  }

  @Get('technical-tests/questions')
  @ApiOperation({
    summary: 'Preguntas de test tÃ©cnico',
    description: 'Obtiene el listado de preguntas para el test tÃ©cnico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Preguntas del test tÃ©cnico.',
    type: [Object],
  })
  getTechnicalQuestions(): AssessmentTestQuestion[] {
    return this.assessmentService.getTechnicalQuestions();
  }

  @Post('me/psychotechnical-tests/submit')
  @ApiOperation({
    summary: 'Enviar respuestas de test psicotÃ©cnico',
    description:
      'EnvÃ­a las respuestas del usuario para el test psicotÃ©cnico.',
  })
  @ApiBody({
    type: SubmitAssessmentTestDto,
    description: 'Respuestas del test psicotÃ©cnico.',
  })
  @ApiResponse({
    status: 201,
    description: 'Resultado del test psicotÃ©cnico.',
    type: AssessmentTestResultEntity,
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
    summary: 'Enviar respuestas de test tÃ©cnico',
    description: 'EnvÃ­a las respuestas del usuario para el test tÃ©cnico.',
  })
  @ApiBody({
    type: SubmitAssessmentTestDto,
    description: 'Respuestas del test tÃ©cnico.',
  })
  @ApiResponse({
    status: 201,
    description: 'Resultado del test tÃ©cnico.',
    type: AssessmentTestResultEntity,
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
    summary: 'Crear resultado de test psicotÃ©cnico',
    description: 'Crea un nuevo resultado para el test psicotÃ©cnico.',
  })
  @ApiBody({
    type: CreateAssessmentTestDto,
    description: 'Datos del resultado del test psicotÃ©cnico.',
  })
  @ApiResponse({
    status: 201,
    description: 'Resultado creado.',
    type: AssessmentTestResultEntity,
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
    summary: 'Crear resultado de test tÃ©cnico',
    description: 'Crea un nuevo resultado para el test tÃ©cnico.',
  })
  @ApiBody({
    type: CreateAssessmentTestDto,
    description: 'Datos del resultado del test tÃ©cnico.',
  })
  @ApiResponse({
    status: 201,
    description: 'Resultado creado.',
    type: AssessmentTestResultEntity,
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
  findMyTestResults(
    @Req() request: AuthenticatedRequest,
  ): Promise<AssessmentTestResultEntity[]> {
    return this.assessmentService.findMyTestResults(request.user);
  }

  @Get('me/test-results/latest')
  @ApiOperation({
    summary: 'Obtener mis Ãºltimos resultados de tests',
    description:
      'Devuelve los resultados mÃ¡s recientes de los tests del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ãšltimos resultados.',
    type: [AssessmentTestResultEntity],
  })
  findMyLatestTestResults(
    @Req() request: AuthenticatedRequest,
  ): Promise<AssessmentTestResultEntity[]> {
    return this.assessmentService.findMyLatestTestResults(request.user);
  }
}
