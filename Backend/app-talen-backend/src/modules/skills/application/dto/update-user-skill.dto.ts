import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SkillLevel } from '../../domain/skill-level.enum';

export class UpdateUserSkillDto {
  @IsOptional()
  @IsEnum(SkillLevel, {
    message: 'level must be one of: INITIAL, MEDIUM, ADVANCED',
  })
  level?: SkillLevel;

  @IsOptional()
  @IsString()
  evidence?: string;

  @IsOptional()
  @IsString()
  source?: string;
}
