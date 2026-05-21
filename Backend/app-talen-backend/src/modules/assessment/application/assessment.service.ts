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
import { UserSkill } from '../../skills/infrastructure/entities/user-skill.entity';
import { AssessmentLevel } from '../domain/assessment-level.enum';
import { AssessmentTestQuestion } from '../domain/assessment-test-question.type';
import { AssessmentTestResult } from '../domain/assessment-test-result.enum';
import { AssessmentTestType } from '../domain/assessment-test-type.enum';
import {
  psychotechnicalQuestions,
  technicalQuestions,
} from './assessment-test-question-bank';
import { CreateAssessmentTestDto } from './dto/create-assessment-test.dto';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import {
  GeneratedTest,
  GeneratedTestsResponseDto,
} from './dto/generated-tests-response.dto';
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
    @InjectRepository(UserSkill)
    private readonly userSkillsRepository: Repository<UserSkill>,
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

  async consolidateMyAssessment(
    authUser: AuthTokenPayload,
  ): Promise<Assessment> {
    const testResults = await this.findMyTestResults(authUser);

    if (testResults.length === 0) {
      throw new BadRequestException(
        'No test results found. Complete at least one psychotechnical and one technical test first.',
      );
    }

    const psychotechnicalResults = testResults.filter(
      (result) => result.type === AssessmentTestType.PSYCHOTECHNICAL,
    );
    const technicalResults = testResults.filter(
      (result) => result.type === AssessmentTestType.TECHNICAL,
    );

    if (psychotechnicalResults.length === 0 || technicalResults.length === 0) {
      throw new BadRequestException(
        'Consolidated assessment requires at least one psychotechnical test and one technical test result.',
      );
    }

    const psychotechnicalAverage = this.calculateAveragePercentage(
      psychotechnicalResults,
    );
    const technicalAverage = this.calculateAveragePercentage(technicalResults);

    return this.createMe(authUser, {
      digitalLevel: this.mapPercentageToAssessmentLevel(technicalAverage),
      cognitiveLevel: this.mapPercentageToAssessmentLevel(
        psychotechnicalAverage,
      ),
      socioEmotionalLevel: this.mapPercentageToAssessmentLevel(
        psychotechnicalAverage,
      ),
      careerGoal:
        'Mejorar el perfil profesional con base en resultados de pruebas.',
      answers: {
        source: 'assessment_test_results',
        generatedAt: new Date().toISOString(),
        totals: {
          tests: testResults.length,
          psychotechnical: psychotechnicalResults.length,
          technical: technicalResults.length,
        },
        averages: {
          psychotechnical: psychotechnicalAverage,
          technical: technicalAverage,
        },
        testResults: testResults.map((result) => ({
          id: result.id,
          title: result.title,
          type: result.type,
          percentage: result.percentage,
          result: result.result,
          feedback: result.feedback,
          createdAt: result.createdAt,
        })),
      },
    });
  }

  async generateTestsForProfile(
    authUser: AuthTokenPayload,
  ): Promise<GeneratedTestsResponseDto> {
    const profile = await this.findTalentProfile(authUser);

    // Obtener skills tecnicas del usuario
    const userSkills = await this.userSkillsRepository.find({
      where: { profileId: profile.id },
      relations: ['skill'],
    });

    const technicalSkills = userSkills.filter(
      (us) =>
        us.skill?.category &&
        us.skill.category.toLowerCase().includes('tecnic'),
    );

    // Generar tests
    const psychotechnicalTests = this.generatePsychotechnicalTests();
    const technicalTests =
      this.generateTechnicalTestsFromSkills(technicalSkills);

    // Contar total de preguntas
    const totalQuestionsCount =
      psychotechnicalTests.reduce((sum, t) => sum + t.questionCount, 0) +
      technicalTests.reduce((sum, t) => sum + t.questionCount, 0);

    return {
      psychotechnicalTests,
      technicalTests,
      totalTests: psychotechnicalTests.length + technicalTests.length,
      profile: {
        fullName: profile.fullName ?? 'Sin nombre',
        technicalSkillsCount: technicalSkills.length,
        totalQuestionsCount,
      },
    };
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

  private calculateAveragePercentage(
    results: AssessmentTestResultEntity[],
  ): number {
    if (results.length === 0) {
      return 0;
    }

    const total = results.reduce((sum, result) => sum + result.percentage, 0);
    return Math.round(total / results.length);
  }

  private mapPercentageToAssessmentLevel(percentage: number): AssessmentLevel {
    if (percentage >= 75) {
      return AssessmentLevel.ADVANCED;
    }

    if (percentage >= 50) {
      return AssessmentLevel.INTERMEDIATE;
    }

    return AssessmentLevel.BASIC;
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

  private generatePsychotechnicalTests(): GeneratedTest[] {
    // Crear 1 test psicotecnico con todas las preguntas
    const questions = this.selectQuestionsForTest(
      this.getPublicQuestions(AssessmentTestType.PSYCHOTECHNICAL),
      5,
      20,
    );

    return [
      {
        id: 'psycho_test_1',
        name: 'Test Psicotecnico - Aptitud General',
        description:
          'Evaluacion de razonamiento logico, atencion, toma de decisiones y trabajo en equipo.',
        type: AssessmentTestType.PSYCHOTECHNICAL,
        questionCount: questions.length,
        estimatedDurationMin: questions.length * 2,
        questions,
      },
    ];
  }

  private generateTechnicalTestsFromSkills(
    technicalSkills: UserSkill[],
  ): GeneratedTest[] {
    return technicalSkills.map((userSkill, index) => {
      const skillName = userSkill.skill?.name ?? `Skill ${index + 1}`;

      // Filtrar preguntas tecnicas que podrian relacionarse con la skill
      const allTechnicalQuestions = this.getPublicQuestions(
        AssessmentTestType.TECHNICAL,
      );

      const selectedQuestions = this.selectQuestionsForTest(
        allTechnicalQuestions,
        5,
        20,
      );

      return {
        id: `tech_test_skill_${userSkill.id}`,
        name: `Test Tecnico - ${skillName}`,
        description: `Evaluacion de conocimientos tecnicos en ${skillName}. Incluye conceptos fundamentales y aplicaciones practicas.`,
        type: AssessmentTestType.TECHNICAL,
        skillName,
        questionCount: selectedQuestions.length,
        estimatedDurationMin: selectedQuestions.length * 3,
        questions: selectedQuestions,
      };
    });
  }

  private selectQuestionsForTest(
    questions: AssessmentTestQuestion[],
    minQuestions: number = 5,
    maxQuestions: number = 20,
  ): AssessmentTestQuestion[] {
    // Seleccionar numero aleatorio entre min y max
    const count = Math.max(
      minQuestions,
      Math.min(maxQuestions, questions.length),
    );

    // Shuffear y seleccionar
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
