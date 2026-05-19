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
import { ModuleStatus } from '../domain/module-status.enum';
import { LearningModule as LearningModuleEntity } from './entities/learning-module.entity';
import { LearningPath } from './entities/learning-path.entity';
import { UserModuleProgress } from './entities/user-module-progress.entity';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

const generateLearningPathRequestExample: GenerateLearningPathDto = {
  title: 'Ruta Backend Nivelacion Node.js',
  objective: 'Mejorar empleabilidad como desarrollador backend junior',
};

const updateModuleProgressRequestExample: UpdateModuleProgressDto = {
  status: ModuleStatus.IN_PROGRESS,
  progress: 65,
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

const notFoundProfileExample = {
  statusCode: 404,
  message: 'Profile not found for this user',
  error: 'Not Found',
};

const notFoundAssessmentExample = {
  statusCode: 404,
  message: 'Assessment not found for this profile',
  error: 'Not Found',
};

const notFoundLearningModuleExample = {
  statusCode: 404,
  message: 'Learning module not found for this profile',
  error: 'Not Found',
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
    description: 'Datos opcionales para generar la ruta de aprendizaje.',
    examples: {
      default: {
        summary: 'Generar ruta con titulo y objetivo personalizados',
        value: generateLearningPathRequestExample,
      },
      emptyBody: {
        summary: 'Generar ruta usando valores inferidos',
        value: {},
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Ruta de aprendizaje generada.',
    type: LearningPath,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no tiene rol TALENT.',
    example: forbiddenExample,
  })
  @ApiNotFoundResponse({
    description:
      'No se encontro el perfil del usuario o su assessment mas reciente.',
    examples: {
      profileNotFound: {
        summary: 'Perfil no encontrado',
        value: notFoundProfileExample,
      },
      assessmentNotFound: {
        summary: 'Assessment no encontrado',
        value: notFoundAssessmentExample,
      },
    },
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
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no tiene rol TALENT.',
    example: forbiddenExample,
  })
  @ApiNotFoundResponse({
    description: 'No se encontro el perfil del usuario autenticado.',
    example: notFoundProfileExample,
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
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no tiene rol TALENT.',
    example: forbiddenExample,
  })
  @ApiNotFoundResponse({
    description: 'No se encontro el perfil del usuario autenticado.',
    example: notFoundProfileExample,
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
  @ApiParam({
    name: 'moduleId',
    description: 'UUID del modulo de aprendizaje.',
    example: 'e7f022ea-cf26-4a10-a0d2-3cc4df093221',
  })
  @ApiBody({
    type: UpdateModuleProgressDto,
    description: 'Datos de progreso a actualizar.',
    examples: {
      inProgress: {
        summary: 'Actualizar modulo en progreso',
        value: updateModuleProgressRequestExample,
      },
      completed: {
        summary: 'Marcar modulo como completado',
        value: {
          status: ModuleStatus.COMPLETED,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Progreso actualizado.',
    type: UserModuleProgress,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no tiene rol TALENT.',
    example: forbiddenExample,
  })
  @ApiNotFoundResponse({
    description:
      'No se encontro el perfil del usuario o el modulo para ese perfil.',
    examples: {
      profileNotFound: {
        summary: 'Perfil no encontrado',
        value: notFoundProfileExample,
      },
      learningModuleNotFound: {
        summary: 'Modulo no encontrado para el perfil',
        value: notFoundLearningModuleExample,
      },
    },
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
