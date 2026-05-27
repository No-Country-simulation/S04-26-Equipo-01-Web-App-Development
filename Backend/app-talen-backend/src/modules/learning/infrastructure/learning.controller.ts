import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../auth/infrastructure/types/authenticated-request.type';
import { GenerateLearningPathDto } from '../application/dto/generate-learning-path.dto';
import { UpdateModuleProgressDto } from '../application/dto/update-module-progress.dto';
import { LearningService } from '../application/learning.service';
import { LearningModule as LearningModuleEntity } from './entities/learning-module.entity';
import { LearningPath } from './entities/learning-path.entity';
import { UserModuleProgress } from './entities/user-module-progress.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

const generateLearningPathRequestExample = {
  title: 'Ruta Backend Nivelacion Node.js',
  objective: 'Mejorar empleabilidad como desarrollador backend junior',
};

const updateModuleProgressRequestExample = {
  status: 'IN_PROGRESS',
  progress: 65,
};

const learningPathResponseExample = {
  id: 'ad2c6f36-c8f1-4f4a-89fc-8a5860355dc2',
  profileId: 'c4b4e87a-c7f8-4cf8-a855-637b6a4b57e1',
  title: 'Ruta Backend Nivelacion Node.js',
  objective: 'Mejorar empleabilidad como desarrollador backend junior',
  aiGenerated: true,
  recommendedTrack: 'Backend Development',
  confidence: 82,
  matchingReason:
    'Coincidencia alta con habilidades tecnicas y objetivo profesional.',
  alternativeTracks: [
    { track: 'QA Automation', confidence: 70 },
    { track: 'DevOps Junior', confidence: 61 },
  ],
  createdAt: '2026-05-19T14:30:00.000Z',
};

const learningModuleResponseExample = {
  id: 'e7f022ea-cf26-4a10-a0d2-3cc4df093221',
  learningPathId: 'ad2c6f36-c8f1-4f4a-89fc-8a5860355dc2',
  title: 'Fundamentos de APIs REST con NestJS',
  description: 'Diseno de endpoints, validaciones y manejo de errores comunes.',
  category: 'DIGITAL',
  contentUrl: 'https://plataforma.example.com/cursos/nestjs-rest',
  durationMin: 45,
  order: 1,
};

const progressResponseExample = {
  id: '605d2455-fdc0-4fbe-a20e-1292f6e69928',
  profileId: 'c4b4e87a-c7f8-4cf8-a855-637b6a4b57e1',
  moduleId: 'e7f022ea-cf26-4a10-a0d2-3cc4df093221',
  status: 'IN_PROGRESS',
  progress: 65,
  completedAt: null,
};

const unauthorizedExample = {
  statusCode: 401,
  message: 'Unauthorized',
  error: 'Unauthorized',
};
const forbiddenExample = {
  statusCode: 403,
  message: 'Only TALENT users can manage learning paths',
  error: 'Forbidden',
};
const badRequestExample = {
  statusCode: 400,
  message: ['progress must not be greater than 100'],
  error: 'Bad Request',
};

@ApiTags('Aprendizaje')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Post('learning-paths/me/generate')
  @ApiOperation({
    summary: 'Generar ruta de aprendizaje personalizada',
    description:
      'Crea una ruta de aprendizaje adaptada al usuario autenticado.',
  })
  @ApiBody({
    type: GenerateLearningPathDto,
    description: 'Datos para generar la ruta de aprendizaje.',
    schema: { example: generateLearningPathRequestExample },
  })
  @ApiResponse({
    status: 201,
    description: 'Ruta de aprendizaje generada.',
    type: LearningPath,
    schema: { example: learningPathResponseExample },
  })
  @ApiBadRequestResponse({
    description: 'Datos de generación inválidos.',
    example: badRequestExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o inválido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden generar rutas.',
    example: forbiddenExample,
  })
  generateMyLearningPath(
    @Req() request: AuthenticatedRequest,
    @Body() generateLearningPathDto: GenerateLearningPathDto,
  ): Promise<LearningPath> {
    return this.learningService.generateMyLearningPath(
      request.user,
      generateLearningPathDto,
    );
  }

  @Get('learning-paths/me')
  @ApiOperation({
    summary: 'Listar mis rutas de aprendizaje',
    description:
      'Devuelve todas las rutas de aprendizaje del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de rutas de aprendizaje.',
    type: [LearningPath],
    schema: { example: [learningPathResponseExample] },
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o inválido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden listar rutas.',
    example: forbiddenExample,
  })
  findMyLearningPaths(
    @Req() request: AuthenticatedRequest,
  ): Promise<LearningPath[]> {
    return this.learningService.findMyLearningPaths(request.user);
  }

  @Get('learning-modules/me')
  @ApiOperation({
    summary: 'Listar mis módulos de aprendizaje',
    description:
      'Devuelve todos los módulos de aprendizaje asignados al usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de módulos de aprendizaje.',
    type: [LearningModuleEntity],
    schema: { example: [learningModuleResponseExample] },
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o inválido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden listar módulos.',
    example: forbiddenExample,
  })
  findMyLearningModules(
    @Req() request: AuthenticatedRequest,
  ): Promise<LearningModuleEntity[]> {
    return this.learningService.findMyLearningModules(request.user);
  }

  @Patch('learning-modules/:moduleId/progress')
  @ApiOperation({
    summary: 'Actualizar progreso de módulo',
    description:
      'Permite actualizar el progreso de un módulo de aprendizaje específico.',
  })
  @ApiParam({ name: 'moduleId', description: 'ID del módulo de aprendizaje.' })
  @ApiBody({
    type: UpdateModuleProgressDto,
    description: 'Datos de progreso a actualizar.',
    schema: { example: updateModuleProgressRequestExample },
  })
  @ApiResponse({
    status: 200,
    description: 'Progreso actualizado.',
    type: UserModuleProgress,
    schema: { example: progressResponseExample },
  })
  @ApiBadRequestResponse({
    description: 'Datos de progreso inválidos.',
    example: badRequestExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o inválido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'Solo usuarios TALENT pueden actualizar progreso.',
    example: forbiddenExample,
  })
  updateMyModuleProgress(
    @Req() request: AuthenticatedRequest,
    @Param('moduleId') moduleId: string,
    @Body() updateModuleProgressDto: UpdateModuleProgressDto,
  ): Promise<UserModuleProgress> {
    return this.learningService.updateMyModuleProgress(
      request.user,
      moduleId,
      updateModuleProgressDto,
    );
  }
}
