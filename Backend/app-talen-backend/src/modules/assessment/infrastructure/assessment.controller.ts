import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../auth/infrastructure/types/authenticated-request.type';
import { AssessmentService } from '../application/assessment.service';
import { CreateAssessmentDto } from '../application/dto/create-assessment.dto';
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
}
