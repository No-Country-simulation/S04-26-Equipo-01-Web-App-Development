import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AiAssessmentAnalysis,
  AiSuggestedModule,
  AiSuggestedSkill,
} from '../../ai/domain/ai-assessment-analysis.type';
import { Assessment } from '../../assessment/infrastructure/entities/assessment.entity';
import { AuthTokenPayload } from '../../auth/domain/auth-token-payload.type';
import { Profile } from '../../profiles/infrastructure/entities/profile.entity';
import { SkillLevel } from '../../skills/domain/skill-level.enum';
import { Skill } from '../../skills/infrastructure/entities/skill.entity';
import { UserSkill } from '../../skills/infrastructure/entities/user-skill.entity';
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
  suggestedSkills: AiSuggestedSkill[];
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
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    @InjectRepository(UserSkill)
    private readonly userSkillsRepository: Repository<UserSkill>,
  ) {}

  async generateMyLearningPath(
    authUser: AuthTokenPayload,
    generateLearningPathDto: GenerateLearningPathDto,
  ): Promise<LearningPath> {
    const profile = await this.findTalentProfile(authUser);
    const assessment = await this.findLatestAssessment(profile.id);
    const generatedModules = this.buildModulesFromAssessment(assessment);
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
    const modules = await Promise.all(
      generatedModules.map(async (module) => {
        const skills = await this.findOrCreateSkills(module.suggestedSkills);

        return this.learningModulesRepository.save(
          this.learningModulesRepository.create({
            title: module.title,
            description: module.description,
            category: module.category,
            durationMin: module.durationMin,
            order: module.order,
            learningPathId: learningPath.id,
            skills,
          }),
        );
      }),
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

  async findMyLearningPaths(
    authUser: AuthTokenPayload,
  ): Promise<LearningPath[]> {
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
    const module = await this.findModuleForProfile(profile.id, moduleId);

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

    progress.progress =
      nextStatus === ModuleStatus.COMPLETED ? 100 : nextProgress;
    progress.status = nextStatus;
    progress.completedAt =
      nextStatus === ModuleStatus.COMPLETED
        ? (progress.completedAt ?? new Date())
        : undefined;

    const savedProgress = await this.progressRepository.save(progress);

    if (savedProgress.status === ModuleStatus.COMPLETED) {
      await this.syncSkillsFromCompletedModule(profile.id, module);
    }

    return savedProgress;
  }

  private async findTalentProfile(
    authUser: AuthTokenPayload,
  ): Promise<Profile> {
    if (authUser.role !== UserRole.TALENT) {
      throw new ForbiddenException(
        'Only TALENT users can manage learning paths',
      );
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

  private async findLearningPathById(
    learningPathId: string,
  ): Promise<LearningPath> {
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

  private async findModuleForProfile(
    profileId: string,
    moduleId: string,
  ): Promise<LearningModuleEntity> {
    const module = await this.learningModulesRepository.findOne({
      where: {
        id: moduleId,
        learningPath: {
          profileId,
        },
      },
      relations: {
        learningPath: true,
        skills: true,
      },
    });

    if (!module) {
      throw new NotFoundException('Learning module not found for this profile');
    }

    return module;
  }

  private buildModulesFromAssessment(
    assessment: Assessment,
  ): GeneratedModule[] {
    const aiGeneratedModules = this.buildModulesFromAiDetectedGaps(assessment);

    if (aiGeneratedModules.length > 0) {
      return aiGeneratedModules;
    }

    return [
      {
        title: `Fortalecimiento digital (${assessment.digitalLevel ?? 'basic'})`,
        description:
          'Practicas guiadas para mejorar el uso de herramientas digitales clave.',
        category: LearningModuleCategory.DIGITAL,
        durationMin: 45,
        order: 1,
        suggestedSkills: [],
      },
      {
        title: `Pensamiento cognitivo (${assessment.cognitiveLevel ?? 'basic'})`,
        description:
          'Ejercicios para resolver problemas, ordenar informacion y tomar decisiones.',
        category: LearningModuleCategory.COGNITIVE,
        durationMin: 40,
        order: 2,
        suggestedSkills: [],
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
        suggestedSkills: [],
      },
    ];
  }

  private buildModulesFromAiDetectedGaps(
    assessment: Assessment,
  ): GeneratedModule[] {
    const detectedGaps = assessment.detectedGaps;

    if (!this.isAiDetectedGaps(detectedGaps)) {
      return [];
    }

    return detectedGaps.recommendedModules.map((module, index) => {
      const category = this.toLearningModuleCategory(module.category);

      return {
        title: module.title,
        description: module.description,
        category,
        durationMin: module.durationMin,
        order: index + 1,
        suggestedSkills: this.findSuggestedSkillsForModule(
          category,
          detectedGaps.suggestedSkills,
        ),
      };
    });
  }

  private isAiDetectedGaps(
    value: unknown,
  ): value is AiAssessmentAnalysis['detectedGaps'] {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      Array.isArray(value.recommendedModules) &&
      value.recommendedModules.length > 0 &&
      value.recommendedModules.every((module) =>
        this.isAiSuggestedModule(module),
      ) &&
      Array.isArray(value.suggestedSkills) &&
      value.suggestedSkills.every((skill) => this.isAiSuggestedSkill(skill))
    );
  }

  private isAiSuggestedModule(value: unknown): value is AiSuggestedModule {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.title === 'string' &&
      typeof value.description === 'string' &&
      typeof value.durationMin === 'number' &&
      this.isLearningModuleCategory(value.category)
    );
  }

  private isLearningModuleCategory(
    value: unknown,
  ): value is AiSuggestedModule['category'] {
    return (
      value === LearningModuleCategory.DIGITAL ||
      value === LearningModuleCategory.COGNITIVE ||
      value === LearningModuleCategory.SOCIO_EMOTIONAL
    );
  }

  private isAiSuggestedSkill(value: unknown): value is AiSuggestedSkill {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.name === 'string' &&
      typeof value.category === 'string' &&
      this.isSkillLevel(value.level)
    );
  }

  private isSkillLevel(value: unknown): value is AiSuggestedSkill['level'] {
    return (
      value === SkillLevel.INITIAL ||
      value === SkillLevel.MEDIUM ||
      value === SkillLevel.ADVANCED
    );
  }

  private toLearningModuleCategory(
    category: AiSuggestedModule['category'],
  ): LearningModuleCategory {
    if (category === 'digital') {
      return LearningModuleCategory.DIGITAL;
    }

    if (category === 'cognitive') {
      return LearningModuleCategory.COGNITIVE;
    }

    return LearningModuleCategory.SOCIO_EMOTIONAL;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private findSuggestedSkillsForModule(
    moduleCategory: LearningModuleCategory,
    suggestedSkills: AiSuggestedSkill[],
  ): AiSuggestedSkill[] {
    return suggestedSkills.filter(
      (skill) =>
        this.toLearningModuleCategoryFromSkill(skill) === moduleCategory,
    );
  }

  private toLearningModuleCategoryFromSkill(
    skill: AiSuggestedSkill,
  ): LearningModuleCategory {
    const category = skill.category.trim().toLowerCase();

    if (category.includes('socio')) {
      return LearningModuleCategory.SOCIO_EMOTIONAL;
    }

    if (category.includes('cogn')) {
      return LearningModuleCategory.COGNITIVE;
    }

    return LearningModuleCategory.DIGITAL;
  }

  private async findOrCreateSkills(
    suggestedSkills: AiSuggestedSkill[],
  ): Promise<Skill[]> {
    const uniqueSuggestedSkills = this.uniqueSuggestedSkills(suggestedSkills);

    return Promise.all(
      uniqueSuggestedSkills.map((skill) =>
        this.findOrCreateSkill(skill.name, skill.category),
      ),
    );
  }

  private uniqueSuggestedSkills(
    suggestedSkills: AiSuggestedSkill[],
  ): AiSuggestedSkill[] {
    const seen = new Set<string>();

    return suggestedSkills.filter((skill) => {
      const normalizedName = this.normalizeSkillName(skill.name);

      if (seen.has(normalizedName)) {
        return false;
      }

      seen.add(normalizedName);
      return true;
    });
  }

  private async findOrCreateSkill(
    name: string,
    category: string,
  ): Promise<Skill> {
    const normalizedName = this.normalizeSkillName(name);
    const normalizedCategory = category.trim().toLowerCase();
    const existingSkill = await this.skillsRepository.findOne({
      where: { name: normalizedName },
    });

    if (existingSkill) {
      return existingSkill;
    }

    try {
      return await this.skillsRepository.save(
        this.skillsRepository.create({
          name: normalizedName,
          category: normalizedCategory,
        }),
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const skill = await this.skillsRepository.findOne({
          where: { name: normalizedName },
        });

        if (skill) {
          return skill;
        }
      }

      throw error;
    }
  }

  private async syncSkillsFromCompletedModule(
    profileId: string,
    module: LearningModuleEntity,
  ): Promise<void> {
    if (module.skills.length === 0) {
      return;
    }

    await Promise.all(
      module.skills.map((skill) =>
        this.createOrUpdateUserSkillFromModule(profileId, module, skill),
      ),
    );
  }

  private async createOrUpdateUserSkillFromModule(
    profileId: string,
    module: LearningModuleEntity,
    skill: Skill,
  ): Promise<UserSkill> {
    const existingUserSkill = await this.userSkillsRepository.findOne({
      where: {
        profileId,
        skillId: skill.id,
      },
    });
    const evidence = `Modulo completado: ${module.title}`;

    if (existingUserSkill) {
      existingUserSkill.level = this.upgradeSkillLevel(existingUserSkill.level);
      existingUserSkill.evidence = this.mergeEvidence(
        existingUserSkill.evidence,
        evidence,
      );
      existingUserSkill.source = 'module';

      return this.userSkillsRepository.save(existingUserSkill);
    }

    return this.userSkillsRepository.save(
      this.userSkillsRepository.create({
        profileId,
        skillId: skill.id,
        level: SkillLevel.MEDIUM,
        evidence,
        source: 'module',
      }),
    );
  }

  private upgradeSkillLevel(currentLevel: SkillLevel): SkillLevel {
    if (currentLevel === SkillLevel.INITIAL) {
      return SkillLevel.MEDIUM;
    }

    return currentLevel;
  }

  private mergeEvidence(
    currentEvidence: string | undefined,
    evidence: string,
  ): string {
    if (!currentEvidence) {
      return evidence;
    }

    if (currentEvidence.includes(evidence)) {
      return currentEvidence;
    }

    return `${currentEvidence}; ${evidence}`;
  }

  private normalizeSkillName(name: string): string {
    return name.trim().toLowerCase();
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
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
