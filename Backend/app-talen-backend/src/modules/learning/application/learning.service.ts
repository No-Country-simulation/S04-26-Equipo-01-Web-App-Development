import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment } from '../../assessment/infrastructure/entities/assessment.entity';
import { AuthTokenPayload } from '../../auth/domain/auth-token-payload.type';
import { Profile } from '../../profiles/infrastructure/entities/profile.entity';
import { UserRole } from '../../users/domain/user-role.enum';
import { LearningModuleCategory } from '../domain/learning-module-category.enum';
import { ModuleStatus } from '../domain/module-status.enum';
import { GenerateLearningPathDto } from './dto/generate-learning-path.dto';
import { UpdateModuleProgressDto } from './dto/update-module-progress.dto';
import { LearningModule as LearningModuleEntity } from '../infrastructure/entities/learning-module.entity';
import { LearningPath } from '../infrastructure/entities/learning-path.entity';
import { UserModuleProgress } from '../infrastructure/entities/user-module-progress.entity';

type GeneratedModule = {
  title: string;
  description: string;
  category: LearningModuleCategory;
  durationMin: number;
  order: number;
};

@Injectable()
export class LearningService {
  constructor(
    @InjectRepository(LearningPath)
    private readonly learningPathsRepository: Repository<LearningPath>,
    @InjectRepository(LearningModuleEntity)
    private readonly learningModulesRepository: Repository<LearningModuleEntity>,
    @InjectRepository(UserModuleProgress)
    private readonly progressRepository: Repository<UserModuleProgress>,
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
    @InjectRepository(Assessment)
    private readonly assessmentsRepository: Repository<Assessment>,
  ) {}

  async generateMyLearningPath(
    authUser: AuthTokenPayload,
    generateLearningPathDto: GenerateLearningPathDto,
  ): Promise<LearningPath> {
    const profile = await this.findTalentProfile(authUser);
    const assessment = await this.findLatestAssessment(profile.id);
    const learningPath = await this.learningPathsRepository.save(
      this.learningPathsRepository.create({
        profileId: profile.id,
        title:
          generateLearningPathDto.title ??
          `Ruta de aprendizaje para ${assessment.careerGoal ?? 'empleabilidad'}`,
        objective:
          generateLearningPathDto.objective ??
          assessment.careerGoal ??
          'Fortalecer habilidades clave para mejorar la empleabilidad.',
        aiGenerated: true,
      }),
    );
    const modules = await this.learningModulesRepository.save(
      this.buildModulesFromAssessment(assessment).map((module) =>
        this.learningModulesRepository.create({
          ...module,
          learningPathId: learningPath.id,
        }),
      ),
    );

    await this.progressRepository.save(
      modules.map((module) =>
        this.progressRepository.create({
          profileId: profile.id,
          moduleId: module.id,
          status: ModuleStatus.PENDING,
          progress: 0,
        }),
      ),
    );

    return this.findLearningPathById(learningPath.id);
  }

  async findMyLearningPaths(authUser: AuthTokenPayload): Promise<LearningPath[]> {
    const profile = await this.findTalentProfile(authUser);

    return this.learningPathsRepository.find({
      where: { profileId: profile.id },
      relations: {
        modules: {
          progress: true,
        },
      },
      order: {
        createdAt: 'DESC',
        modules: {
          order: 'ASC',
        },
      },
    });
  }

  async findMyLearningModules(
    authUser: AuthTokenPayload,
  ): Promise<LearningModuleEntity[]> {
    const profile = await this.findTalentProfile(authUser);
    const paths = await this.learningPathsRepository.find({
      where: { profileId: profile.id },
      select: { id: true },
    });

    if (paths.length === 0) {
      return [];
    }

    return this.learningModulesRepository.find({
      where: paths.map((path) => ({ learningPathId: path.id })),
      relations: {
        progress: true,
      },
      order: {
        order: 'ASC',
      },
    });
  }

  async updateMyModuleProgress(
    authUser: AuthTokenPayload,
    moduleId: string,
    updateModuleProgressDto: UpdateModuleProgressDto,
  ): Promise<UserModuleProgress> {
    const profile = await this.findTalentProfile(authUser);
    await this.ensureModuleBelongsToProfile(profile.id, moduleId);

    let progress = await this.progressRepository.findOne({
      where: {
        profileId: profile.id,
        moduleId,
      },
    });

    if (!progress) {
      progress = this.progressRepository.create({
        profileId: profile.id,
        moduleId,
      });
    }

    const nextProgress = updateModuleProgressDto.progress ?? progress.progress;
    const nextStatus =
      updateModuleProgressDto.status ?? this.inferStatus(nextProgress);

    progress.progress = nextStatus === ModuleStatus.COMPLETED ? 100 : nextProgress;
    progress.status = nextStatus;
    progress.completedAt =
      nextStatus === ModuleStatus.COMPLETED ? (progress.completedAt ?? new Date()) : undefined;

    return this.progressRepository.save(progress);
  }

  private async findTalentProfile(authUser: AuthTokenPayload): Promise<Profile> {
    if (authUser.role !== UserRole.TALENT) {
      throw new ForbiddenException('Only TALENT users can manage learning paths');
    }

    const profile = await this.profilesRepository.findOne({
      where: { userId: authUser.userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    return profile;
  }

  private async findLatestAssessment(profileId: string): Promise<Assessment> {
    const assessment = await this.assessmentsRepository.findOne({
      where: { profileId },
      order: { createdAt: 'DESC' },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found for this profile');
    }

    return assessment;
  }

  private async findLearningPathById(learningPathId: string): Promise<LearningPath> {
    const learningPath = await this.learningPathsRepository.findOne({
      where: { id: learningPathId },
      relations: {
        modules: {
          progress: true,
        },
      },
      order: {
        modules: {
          order: 'ASC',
        },
      },
    });

    if (!learningPath) {
      throw new NotFoundException('Learning path not found');
    }

    return learningPath;
  }

  private async ensureModuleBelongsToProfile(
    profileId: string,
    moduleId: string,
  ): Promise<void> {
    const module = await this.learningModulesRepository.findOne({
      where: {
        id: moduleId,
        learningPath: {
          profileId,
        },
      },
      relations: {
        learningPath: true,
      },
    });

    if (!module) {
      throw new NotFoundException('Learning module not found for this profile');
    }
  }

  private buildModulesFromAssessment(assessment: Assessment): GeneratedModule[] {
    return [
      {
        title: `Fortalecimiento digital (${assessment.digitalLevel ?? 'basic'})`,
        description:
          'Practicas guiadas para mejorar el uso de herramientas digitales clave.',
        category: LearningModuleCategory.DIGITAL,
        durationMin: 45,
        order: 1,
      },
      {
        title: `Pensamiento cognitivo (${assessment.cognitiveLevel ?? 'basic'})`,
        description:
          'Ejercicios para resolver problemas, ordenar informacion y tomar decisiones.',
        category: LearningModuleCategory.COGNITIVE,
        durationMin: 40,
        order: 2,
      },
      {
        title: `Habilidades socioemocionales (${
          assessment.socioEmotionalLevel ?? 'basic'
        })`,
        description:
          'Actividades para comunicacion, colaboracion y adaptacion al trabajo.',
        category: LearningModuleCategory.SOCIO_EMOTIONAL,
        durationMin: 40,
        order: 3,
      },
    ];
  }

  private inferStatus(progress: number): ModuleStatus {
    if (progress >= 100) {
      return ModuleStatus.COMPLETED;
    }

    if (progress > 0) {
      return ModuleStatus.IN_PROGRESS;
    }

    return ModuleStatus.PENDING;
  }
}
