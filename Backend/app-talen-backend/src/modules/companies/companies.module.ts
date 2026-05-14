import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './infrastructure/entities/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company])],
  exports: [TypeOrmModule],
})
export class CompaniesModule {}
