import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Profile } from '../profiles/infrastructure/entities/profile.entity';
import { SkillsService } from './application/skills.service';
import { Skill } from './infrastructure/entities/skill.entity';
import { UserSkill } from './infrastructure/entities/user-skill.entity';
import { SkillsController } from './infrastructure/skills.controller';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Skill, UserSkill, Profile])],
  controllers: [SkillsController],
  providers: [SkillsService],
  exports: [TypeOrmModule],
})
export class SkillsModule {}
