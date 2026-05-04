import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateApplication } from './infrastructure/entities/candidate-application.entity';
import { CompanyFeedback } from './infrastructure/entities/company-feedback.entity';
import { JobOpportunity } from './infrastructure/entities/job-opportunity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobOpportunity,
      CandidateApplication,
      CompanyFeedback,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class MarketplaceModule {}
