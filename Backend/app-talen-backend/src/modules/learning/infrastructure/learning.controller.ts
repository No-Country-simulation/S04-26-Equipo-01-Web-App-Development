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

@Controller()
@UseGuards(JwtAuthGuard)
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Post('learning-paths/me/generate')
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
  findMyLearningPaths(
    @Req() request: AuthenticatedRequest,
  ): Promise<LearningPath[]> {
    return this.learningService.findMyLearningPaths(request.user);
  }

  @Get('learning-modules/me')
  findMyLearningModules(
    @Req() request: AuthenticatedRequest,
  ): Promise<LearningModuleEntity[]> {
    return this.learningService.findMyLearningModules(request.user);
  }

  @Patch('learning-modules/:moduleId/progress')
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
