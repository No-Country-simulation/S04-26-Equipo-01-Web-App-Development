import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Skill } from './infrastructure/entities/skill.entity';
import { UserSkill } from './infrastructure/entities/user-skill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Skill, UserSkill])],
  exports: [TypeOrmModule],
})
export class SkillsModule {}
