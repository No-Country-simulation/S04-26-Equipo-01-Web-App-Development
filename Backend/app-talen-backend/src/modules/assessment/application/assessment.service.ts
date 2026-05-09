import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiAssessmentService } from '../../ai/application/ai-assessment.service';
import { AuthTokenPayload } from '../../auth/domain/auth-token-payload.type';
import { Profile } from '../../profiles/infrastructure/entities/profile.entity';
import { UserRole } from '../../users/domain/user-role.enum';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { Assessment } from '../infrastructure/entities/assessment.entity';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentsRepository: Repository<Assessment>,
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
    private readonly aiAssessmentService: AiAssessmentService,
  ) {}

  async createMe(
    authUser: AuthTokenPayload,
    createAssessmentDto: CreateAssessmentDto,
  ): Promise<Assessment> {
    const profile = await this.findTalentProfile(authUser);
    const aiAnalysis = await this.aiAssessmentService.analyzeAssessment(
      profile,
      createAssessmentDto,
    );
    const assessment = this.assessmentsRepository.create({
      ...createAssessmentDto,
      profileId: profile.id,
      aiSummary: aiAnalysis?.summary,
      detectedGaps: aiAnalysis?.detectedGaps,
    });

    return this.assessmentsRepository.save(assessment);
  }

  async findMine(authUser: AuthTokenPayload): Promise<Assessment[]> {
    const profile = await this.findTalentProfile(authUser);

    return this.assessmentsRepository.find({
      where: { profileId: profile.id },
      order: { createdAt: 'DESC' },
    });
  }

  async findMyLatest(authUser: AuthTokenPayload): Promise<Assessment> {
    const profile = await this.findTalentProfile(authUser);
    const assessment = await this.assessmentsRepository.findOne({
      where: { profileId: profile.id },
      order: { createdAt: 'DESC' },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found for this profile');
    }

    return assessment;
  }

  private async findTalentProfile(
    authUser: AuthTokenPayload,
  ): Promise<Profile> {
    if (authUser.role !== UserRole.TALENT) {
      throw new ForbiddenException('Only TALENT users can manage assessments');
    }

    const profile = await this.profilesRepository.findOne({
      where: { userId: authUser.userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    return profile;
  }
}
