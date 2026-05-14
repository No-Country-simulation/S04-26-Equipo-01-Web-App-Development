import {
  BadRequestException,
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
import { AssessmentTestQuestion } from '../domain/assessment-test-question.type';
import { AssessmentTestResult } from '../domain/assessment-test-result.enum';
import { AssessmentTestType } from '../domain/assessment-test-type.enum';
import {
  psychotechnicalQuestions,
  technicalQuestions,
} from './assessment-test-question-bank';
import { CreateAssessmentTestDto } from './dto/create-assessment-test.dto';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { SubmitAssessmentTestDto } from './dto/submit-assessment-test.dto';
import { AssessmentTestResultEntity } from '../infrastructure/entities/assessment-test-result.entity';
import { Assessment } from '../infrastructure/entities/assessment.entity';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentsRepository: Repository<Assessment>,
    @InjectRepository(AssessmentTestResultEntity)
    private readonly assessmentTestResultsRepository: Repository<AssessmentTestResultEntity>,
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

  async createMyPsychotechnicalTestResult(
    authUser: AuthTokenPayload,
    createAssessmentTestDto: CreateAssessmentTestDto,
  ): Promise<AssessmentTestResultEntity> {
    return this.createMyTestResult(
      authUser,
      AssessmentTestType.PSYCHOTECHNICAL,
      createAssessmentTestDto,
    );
  }

  async createMyTechnicalTestResult(
    authUser: AuthTokenPayload,
    createAssessmentTestDto: CreateAssessmentTestDto,
  ): Promise<AssessmentTestResultEntity> {
    return this.createMyTestResult(
      authUser,
      AssessmentTestType.TECHNICAL,
      createAssessmentTestDto,
    );
  }

  getPsychotechnicalQuestions(): AssessmentTestQuestion[] {
    return this.getPublicQuestions(AssessmentTestType.PSYCHOTECHNICAL);
  }

  getTechnicalQuestions(): AssessmentTestQuestion[] {
    return this.getPublicQuestions(AssessmentTestType.TECHNICAL);
  }

  async submitMyPsychotechnicalTest(
    authUser: AuthTokenPayload,
    submitAssessmentTestDto: SubmitAssessmentTestDto,
  ): Promise<AssessmentTestResultEntity> {
    return this.submitMyTest(
      authUser,
      AssessmentTestType.PSYCHOTECHNICAL,
      'Prueba psicotecnica',
      submitAssessmentTestDto,
    );
  }

  async submitMyTechnicalTest(
    authUser: AuthTokenPayload,
    submitAssessmentTestDto: SubmitAssessmentTestDto,
  ): Promise<AssessmentTestResultEntity> {
    return this.submitMyTest(
      authUser,
      AssessmentTestType.TECHNICAL,
      'Prueba tecnica',
      submitAssessmentTestDto,
    );
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

  async findMyTestResults(
    authUser: AuthTokenPayload,
  ): Promise<AssessmentTestResultEntity[]> {
    const profile = await this.findTalentProfile(authUser);

    return this.assessmentTestResultsRepository.find({
      where: { profileId: profile.id },
      order: { createdAt: 'DESC' },
    });
  }

  async findMyLatestTestResults(
    authUser: AuthTokenPayload,
  ): Promise<AssessmentTestResultEntity[]> {
    const profile = await this.findTalentProfile(authUser);
    const [psychotechnical, technical] = await Promise.all([
      this.assessmentTestResultsRepository.findOne({
        where: {
          profileId: profile.id,
          type: AssessmentTestType.PSYCHOTECHNICAL,
        },
        order: { createdAt: 'DESC' },
      }),
      this.assessmentTestResultsRepository.findOne({
        where: {
          profileId: profile.id,
          type: AssessmentTestType.TECHNICAL,
        },
        order: { createdAt: 'DESC' },
      }),
    ]);

    return [psychotechnical, technical].filter(
      (result): result is AssessmentTestResultEntity => Boolean(result),
    );
  }

  private async createMyTestResult(
    authUser: AuthTokenPayload,
    type: AssessmentTestType,
    createAssessmentTestDto: CreateAssessmentTestDto,
  ): Promise<AssessmentTestResultEntity> {
    const profile = await this.findTalentProfile(authUser);
    const maxScore = createAssessmentTestDto.maxScore ?? 100;

    if (createAssessmentTestDto.score > maxScore) {
      throw new BadRequestException('Score cannot be greater than maxScore');
    }

    const percentage = this.calculatePercentage(
      createAssessmentTestDto.score,
      maxScore,
    );

    const testResult = this.assessmentTestResultsRepository.create({
      profileId: profile.id,
      type,
      title: createAssessmentTestDto.title,
      answers: createAssessmentTestDto.answers,
      score: createAssessmentTestDto.score,
      maxScore,
      percentage,
      result: this.calculateResult(percentage),
      feedback: createAssessmentTestDto.feedback,
    });

    return this.assessmentTestResultsRepository.save(testResult);
  }

  private async submitMyTest(
    authUser: AuthTokenPayload,
    type: AssessmentTestType,
    title: string,
    submitAssessmentTestDto: SubmitAssessmentTestDto,
  ): Promise<AssessmentTestResultEntity> {
    const questions = this.getQuestionBank(type);
    const score = this.calculateTestScore(
      submitAssessmentTestDto.answers,
      type,
    );
    const maxScore = questions.reduce(
      (total, question) => total + question.score,
      0,
    );

    return this.createMyTestResult(authUser, type, {
      title,
      answers: submitAssessmentTestDto.answers,
      score,
      maxScore,
      feedback: this.buildTestFeedback(
        type,
        this.calculatePercentage(score, maxScore),
      ),
    });
  }

  private calculateTestScore(
    answers: Record<string, string>,
    type: AssessmentTestType,
  ): number {
    const questions = this.getQuestionBank(type);
    const questionIds = new Set(questions.map((question) => question.id));

    for (const questionId of questionIds) {
      if (!answers[questionId]) {
        throw new BadRequestException(
          `Missing answer for question ${questionId}`,
        );
      }
    }

    for (const answerQuestionId of Object.keys(answers)) {
      if (!questionIds.has(answerQuestionId)) {
        throw new BadRequestException(`Invalid question ${answerQuestionId}`);
      }
    }

    return questions.reduce((total, question) => {
      const answer = answers[question.id];
      return answer === question.correctAnswer ? total + question.score : total;
    }, 0);
  }

  private getPublicQuestions(
    type: AssessmentTestType,
  ): AssessmentTestQuestion[] {
    return this.getQuestionBank(type).map((question) => ({
      id: question.id,
      text: question.text,
      category: question.category,
      type: question.type,
      options: question.options,
    }));
  }

  private getQuestionBank(type: AssessmentTestType) {
    if (type === AssessmentTestType.PSYCHOTECHNICAL) {
      return psychotechnicalQuestions;
    }

    return technicalQuestions;
  }

  private buildTestFeedback(
    type: AssessmentTestType,
    percentage: number,
  ): string {
    const testName =
      type === AssessmentTestType.PSYCHOTECHNICAL ? 'psicotecnica' : 'tecnica';

    if (percentage >= 75) {
      return `Resultado alto en la prueba ${testName}. Puede avanzar con una ruta de aprendizaje mas desafiante.`;
    }

    if (percentage >= 50) {
      return `Resultado medio en la prueba ${testName}. Conviene reforzar los puntos evaluados antes de avanzar a temas complejos.`;
    }

    return `Resultado inicial en la prueba ${testName}. Se recomienda comenzar con fundamentos y practica guiada.`;
  }

  private calculatePercentage(score: number, maxScore: number): number {
    return Math.min(100, Math.round((score / maxScore) * 100));
  }

  private calculateResult(percentage: number): AssessmentTestResult {
    if (percentage >= 75) {
      return AssessmentTestResult.HIGH;
    }

    if (percentage >= 50) {
      return AssessmentTestResult.MEDIUM;
    }

    return AssessmentTestResult.LOW;
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
