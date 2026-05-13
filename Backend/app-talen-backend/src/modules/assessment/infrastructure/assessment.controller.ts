import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../auth/infrastructure/types/authenticated-request.type';
import { AssessmentService } from '../application/assessment.service';
import { CreateAssessmentTestDto } from '../application/dto/create-assessment-test.dto';
import { CreateAssessmentDto } from '../application/dto/create-assessment.dto';
import { SubmitAssessmentTestDto } from '../application/dto/submit-assessment-test.dto';
import { AssessmentTestQuestion } from '../domain/assessment-test-question.type';
import { AssessmentTestResultEntity } from './entities/assessment-test-result.entity';
import { Assessment } from './entities/assessment.entity';

@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('me')
  createMe(
    @Req() request: AuthenticatedRequest,
    @Body() createAssessmentDto: CreateAssessmentDto,
  ): Promise<Assessment> {
    return this.assessmentService.createMe(request.user, createAssessmentDto);
  }

  @Get('me')
  findMine(@Req() request: AuthenticatedRequest): Promise<Assessment[]> {
    return this.assessmentService.findMine(request.user);
  }

  @Get('me/latest')
  findMyLatest(@Req() request: AuthenticatedRequest): Promise<Assessment> {
    return this.assessmentService.findMyLatest(request.user);
  }

  @Get('psychotechnical-tests/questions')
  getPsychotechnicalQuestions(): AssessmentTestQuestion[] {
    return this.assessmentService.getPsychotechnicalQuestions();
  }

  @Get('technical-tests/questions')
  getTechnicalQuestions(): AssessmentTestQuestion[] {
    return this.assessmentService.getTechnicalQuestions();
  }

  @Post('me/psychotechnical-tests/submit')
  submitMyPsychotechnicalTest(
    @Req() request: AuthenticatedRequest,
    @Body() submitAssessmentTestDto: SubmitAssessmentTestDto,
  ): Promise<AssessmentTestResultEntity> {
    return this.assessmentService.submitMyPsychotechnicalTest(
      request.user,
      submitAssessmentTestDto,
    );
  }

  @Post('me/technical-tests/submit')
  submitMyTechnicalTest(
    @Req() request: AuthenticatedRequest,
    @Body() submitAssessmentTestDto: SubmitAssessmentTestDto,
  ): Promise<AssessmentTestResultEntity> {
    return this.assessmentService.submitMyTechnicalTest(
      request.user,
      submitAssessmentTestDto,
    );
  }

  @Post('me/psychotechnical-tests')
  createMyPsychotechnicalTestResult(
    @Req() request: AuthenticatedRequest,
    @Body() createAssessmentTestDto: CreateAssessmentTestDto,
  ): Promise<AssessmentTestResultEntity> {
    return this.assessmentService.createMyPsychotechnicalTestResult(
      request.user,
      createAssessmentTestDto,
    );
  }

  @Post('me/technical-tests')
  createMyTechnicalTestResult(
    @Req() request: AuthenticatedRequest,
    @Body() createAssessmentTestDto: CreateAssessmentTestDto,
  ): Promise<AssessmentTestResultEntity> {
    return this.assessmentService.createMyTechnicalTestResult(
      request.user,
      createAssessmentTestDto,
    );
  }

  @Get('me/test-results')
  findMyTestResults(
    @Req() request: AuthenticatedRequest,
  ): Promise<AssessmentTestResultEntity[]> {
    return this.assessmentService.findMyTestResults(request.user);
  }

  @Get('me/test-results/latest')
  findMyLatestTestResults(
    @Req() request: AuthenticatedRequest,
  ): Promise<AssessmentTestResultEntity[]> {
    return this.assessmentService.findMyLatestTestResults(request.user);
  }
}
