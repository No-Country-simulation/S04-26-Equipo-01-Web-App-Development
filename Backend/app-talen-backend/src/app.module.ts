import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeormConfig } from './config/typeorm.config';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { LearningModule } from './modules/learning/learning.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { SkillsModule } from './modules/skills/skills.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormConfig),
    AuthModule,
    UsersModule,
    ProfilesModule,
    AssessmentModule,
    LearningModule,
    SkillsModule,
    CompaniesModule,
    MarketplaceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
