import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PDFParse } from 'pdf-parse';
import { Repository } from 'typeorm';
import { AiCvService } from '../../ai/application/ai-cv.service';
import { AiCvAnalysis } from '../../ai/domain/ai-cv-analysis.type';
import { Assessment } from '../../assessment/infrastructure/entities/assessment.entity';
import { AuthTokenPayload } from '../../auth/domain/auth-token-payload.type';
import { UserModuleProgress } from '../../learning/infrastructure/entities/user-module-progress.entity';
import { SkillLevel } from '../../skills/domain/skill-level.enum';
import { UserSkill } from '../../skills/infrastructure/entities/user-skill.entity';
import { UserRole } from '../../users/domain/user-role.enum';
import { AnalyzeCvDto } from './dto/analyze-cv.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateInterestedRolesDto } from './dto/update-interested-roles.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateWorkPreferencesDto } from './dto/update-work-preferences.dto';
import { CvAnalysisResponse } from '../domain/cv-analysis-response.type';
import { UploadedCvFile } from '../domain/uploaded-cv-file.type';
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
    private readonly aiCvService: AiCvService,
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

  async updateMyWorkPreferences(
    authUser: AuthTokenPayload,
    updateWorkPreferencesDto: UpdateWorkPreferencesDto,
  ): Promise<Profile> {
    this.ensureTalent(authUser);

    const profile = await this.findMyProfile(authUser.userId);
    this.profilesRepository.merge(profile, updateWorkPreferencesDto);

    return this.profilesRepository.save(profile);
  }

  async updateMyInterestedRoles(
    authUser: AuthTokenPayload,
    updateInterestedRolesDto: UpdateInterestedRolesDto,
  ): Promise<Profile> {
    this.ensureTalent(authUser);

    const profile = await this.findMyProfile(authUser.userId);
    profile.interestedRoles = updateInterestedRolesDto.interestedRoles;

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

  async analyzeMyCv(
    authUser: AuthTokenPayload,
    file: UploadedCvFile | undefined,
    analyzeCvDto: AnalyzeCvDto,
  ): Promise<CvAnalysisResponse> {
    this.ensureTalent(authUser);

    const cvText = await this.extractCvText(file, analyzeCvDto.extractedText);
    const analysis = await this.aiCvService.analyzeCv(cvText);

    if (!analysis) {
      throw new BadRequestException('CV analysis could not be generated');
    }

    const appliedFields: string[] = [];
    let updatedProfile: Profile | undefined;

    if (analyzeCvDto.applyToProfile) {
      const profile = await this.findMyProfile(authUser.userId);

      appliedFields.push(...this.applyProfileSuggestions(profile, analysis));
      updatedProfile = await this.profilesRepository.save(profile);
    }

    return {
      ...analysis,
      fileName: file?.originalname,
      extractedTextLength: cvText.length,
      appliedFields,
      updatedProfile,
    };
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
      profile.country,
      profile.preferredModality,
      this.hasInterestedRoles(profile) ? profile.interestedRoles : undefined,
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

  private hasInterestedRoles(profile: Profile): boolean {
    return (
      Array.isArray(profile.interestedRoles) &&
      profile.interestedRoles.length > 0
    );
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

  private async extractCvText(
    file: UploadedCvFile | undefined,
    extractedText: string | undefined,
  ): Promise<string> {
    const normalizedExtractedText = extractedText?.trim();

    if (normalizedExtractedText) {
      return normalizedExtractedText;
    }

    if (!file) {
      throw new BadRequestException('CV file or extractedText is required');
    }

    if (this.isPdfFile(file)) {
      return this.extractPdfText(file);
    }

    if (!this.isTextFile(file)) {
      throw new BadRequestException(
        'Only PDF and text/plain files can be read directly. For DOCX, send extractedText with the file.',
      );
    }

    const fileText = file.buffer.toString('utf8').trim();

    if (!fileText) {
      throw new BadRequestException('CV text is empty');
    }

    return fileText;
  }

  private async extractPdfText(file: UploadedCvFile): Promise<string> {
    const parser = new PDFParse({ data: file.buffer });

    try {
      const result = await parser.getText();
      const text = result.text.trim();

      if (!text) {
        throw new BadRequestException('PDF text is empty');
      }

      return text;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('PDF could not be parsed');
    } finally {
      await parser.destroy();
    }
  }

  private isPdfFile(file: UploadedCvFile): boolean {
    return (
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf')
    );
  }

  private isTextFile(file: UploadedCvFile): boolean {
    return (
      file.mimetype === 'text/plain' ||
      file.originalname.toLowerCase().endsWith('.txt')
    );
  }

  private applyProfileSuggestions(
    profile: Profile,
    analysis: AiCvAnalysis,
  ): string[] {
    const appliedFields: string[] = [];
    const suggestions = analysis.profileSuggestions;

    if (suggestions.fullName && !profile.fullName) {
      profile.fullName = suggestions.fullName;
      appliedFields.push('fullName');
    }

    if (suggestions.location && !profile.location) {
      profile.location = suggestions.location;
      appliedFields.push('location');
    }

    if (suggestions.country && !profile.country) {
      profile.country = suggestions.country;
      appliedFields.push('country');
    }

    if (suggestions.preferredModality && !profile.preferredModality) {
      profile.preferredModality = suggestions.preferredModality;
      appliedFields.push('preferredModality');
    }

    if (suggestions.headline && !profile.headline) {
      profile.headline = suggestions.headline;
      appliedFields.push('headline');
    }

    if (suggestions.professionalBio && !profile.professionalBio) {
      profile.professionalBio = suggestions.professionalBio;
      appliedFields.push('professionalBio');
    }

    if (
      suggestions.yearsExperience !== undefined &&
      profile.yearsExperience === undefined
    ) {
      profile.yearsExperience = suggestions.yearsExperience;
      appliedFields.push('yearsExperience');
    }

    if (
      suggestions.interestedRoles &&
      suggestions.interestedRoles.length > 0 &&
      !this.hasInterestedRoles(profile)
    ) {
      profile.interestedRoles = suggestions.interestedRoles;
      appliedFields.push('interestedRoles');
    }

    return appliedFields;
  }
}
