import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment } from './infrastructure/entities/assessment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Assessment])],
  exports: [TypeOrmModule],
})
export class AssessmentModule {}
