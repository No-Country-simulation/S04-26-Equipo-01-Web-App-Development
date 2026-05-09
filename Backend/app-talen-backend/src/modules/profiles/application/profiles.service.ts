import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment } from '../../assessment/infrastructure/entities/assessment.entity';
import { AuthTokenPayload } from '../../auth/domain/auth-token-payload.type';
import { UserModuleProgress } from '../../learning/infrastructure/entities/user-module-progress.entity';
import { SkillLevel } from '../../skills/domain/skill-level.enum';
import { UserSkill } from '../../skills/infrastructure/entities/user-skill.entity';
import { UserRole } from '../../users/domain/user-role.enum';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from '../infrastructure/entities/profile.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
    @InjectRepository(Assessment)
    private readonly assessmentsRepository: Repository<Assessment>,
    @InjectRepository(UserModuleProgress)
    private readonly progressRepository: Repository<UserModuleProgress>,
    @InjectRepository(UserSkill)
    private readonly userSkillsRepository: Repository<UserSkill>,
  ) {}

  async createMe(
    authUser: AuthTokenPayload,
    createProfileDto: CreateProfileDto,
  ): Promise<Profile> {
    this.ensureTalent(authUser);

    const existingProfile = await this.profilesRepository.findOne({
      where: { userId: authUser.userId },
    });

    if (existingProfile) {
      this.profilesRepository.merge(existingProfile, createProfileDto);
      return this.profilesRepository.save(existingProfile);
    }

    const profile = this.profilesRepository.create({
      ...createProfileDto,
      userId: authUser.userId,
    });

    return this.profilesRepository.save(profile);
  }

  async getMe(authUser: AuthTokenPayload): Promise<Profile> {
    this.ensureTalent(authUser);

    return this.findMyProfile(authUser.userId);
  }

  async updateMe(
    authUser: AuthTokenPayload,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    this.ensureTalent(authUser);

    const profile = await this.findMyProfile(authUser.userId);
    this.profilesRepository.merge(profile, updateProfileDto);

    return this.profilesRepository.save(profile);
  }

  async recalculateMyEmployabilityScore(
    authUser: AuthTokenPayload,
  ): Promise<Profile> {
    this.ensureTalent(authUser);

    const profile = await this.findMyProfile(authUser.userId);
    const [assessment, progressRecords, userSkills] = await Promise.all([
      this.assessmentsRepository.findOne({
        where: { profileId: profile.id },
        order: { createdAt: 'DESC' },
      }),
      this.progressRepository.find({
        where: { profileId: profile.id },
      }),
      this.userSkillsRepository.find({
        where: { profileId: profile.id },
      }),
    ]);

    profile.employabilityScore = this.calculateEmployabilityScore(
      profile,
      Boolean(assessment),
      progressRecords,
      userSkills,
    );

    return this.profilesRepository.save(profile);
  }

  private async findMyProfile(userId: string): Promise<Profile> {
    const profile = await this.profilesRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    return profile;
  }

  private ensureTalent(authUser: AuthTokenPayload): void {
    if (authUser.role !== UserRole.TALENT) {
      throw new ForbiddenException('Only TALENT users can manage profiles');
    }
  }

  private calculateEmployabilityScore(
    profile: Profile,
    hasAssessment: boolean,
    progressRecords: UserModuleProgress[],
    userSkills: UserSkill[],
  ): number {
    const profileScore = this.calculateProfileCompleteness(profile) * 20;
    const assessmentScore = hasAssessment ? 20 : 0;
    const progressScore = this.calculateAverageProgress(progressRecords) * 35;
    const skillsScore = this.calculateSkillsScore(userSkills) * 25;

    return Math.min(
      100,
      Math.round(profileScore + assessmentScore + progressScore + skillsScore),
    );
  }

  private calculateProfileCompleteness(profile: Profile): number {
    const fields = [
      profile.fullName,
      profile.location,
      profile.currentStatus,
      profile.headline,
      profile.professionalBio,
      profile.yearsExperience,
    ];
    const completedFields = fields.filter(
      (value) => value !== null && value !== undefined && value !== '',
    ).length;

    return completedFields / fields.length;
  }

  private calculateAverageProgress(
    progressRecords: UserModuleProgress[],
  ): number {
    if (progressRecords.length === 0) {
      return 0;
    }

    const totalProgress = progressRecords.reduce(
      (total, progressRecord) => total + progressRecord.progress,
      0,
    );

    return totalProgress / progressRecords.length / 100;
  }

  private calculateSkillsScore(userSkills: UserSkill[]): number {
    if (userSkills.length === 0) {
      return 0;
    }

    const skillQuantityScore = Math.min(userSkills.length / 5, 1) * 0.4;
    const levelScore =
      (userSkills.reduce(
        (total, userSkill) => total + this.getSkillLevelWeight(userSkill.level),
        0,
      ) /
        userSkills.length) *
      0.6;

    return skillQuantityScore + levelScore;
  }

  private getSkillLevelWeight(level: SkillLevel): number {
    if (level === SkillLevel.ADVANCED) {
      return 1;
    }

    if (level === SkillLevel.MEDIUM) {
      return 0.65;
    }

    return 0.35;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
