import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SkillLevel } from '../../domain/skill-level.enum';

export class UpdateUserSkillDto {
  @ApiPropertyOptional({
    description: 'Nuevo nivel de dominio de la habilidad.',
    enum: SkillLevel,
    example: SkillLevel.ADVANCED,
  })
  @IsOptional()
  @IsEnum(SkillLevel, {
    message: 'level must be one of: INITIAL, MEDIUM, ADVANCED',
  })
  level?: SkillLevel;

  @ApiPropertyOptional({
    description: 'Nueva evidencia asociada a la habilidad.',
    example: 'https://www.credly.com/badges/typescript',
  })
  @IsOptional()
  @IsString()
  evidence?: string;

  @ApiPropertyOptional({
    description: 'Nueva fuente de aprendizaje asociada a la habilidad.',
    example: 'bootcamp',
  })
  @IsOptional()
  @IsString()
  source?: string;
}
