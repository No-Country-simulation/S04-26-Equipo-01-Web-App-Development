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
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

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
  })
  @ApiResponse({
    status: 201,
    description: 'Ruta de aprendizaje generada.',
    type: LearningPath,
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
  })
  @ApiResponse({
    status: 200,
    description: 'Progreso actualizado.',
    type: UserModuleProgress,
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
