import { Module } from '@nestjs/common';
import { AiAssessmentService } from './application/ai-assessment.service';

@Module({
  providers: [AiAssessmentService],
  exports: [AiAssessmentService],
})
export class AiModule {}
