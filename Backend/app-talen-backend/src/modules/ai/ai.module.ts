import { Module } from '@nestjs/common';
import { AiAssessmentService } from './application/ai-assessment.service';
import { AiCvService } from './application/ai-cv.service';

@Module({
  providers: [AiAssessmentService, AiCvService],
  exports: [AiAssessmentService, AiCvService],
})
export class AiModule {}
