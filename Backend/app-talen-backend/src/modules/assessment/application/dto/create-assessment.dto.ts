import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { AssessmentLevel } from '../../domain/assessment-level.enum';

export class CreateAssessmentDto {
  @ApiPropertyOptional({
    enum: AssessmentLevel,
    example: AssessmentLevel.BASIC,
  })
  @IsOptional()
  @IsEnum(AssessmentLevel, {
    message: 'digitalLevel must be one of: basic, intermediate, advanced',
  })
  digitalLevel?: AssessmentLevel;

  @ApiPropertyOptional({
    enum: AssessmentLevel,
    example: AssessmentLevel.INTERMEDIATE,
  })
  @IsOptional()
  @IsEnum(AssessmentLevel, {
    message: 'cognitiveLevel must be one of: basic, intermediate, advanced',
  })
  cognitiveLevel?: AssessmentLevel;

  @ApiPropertyOptional({
    enum: AssessmentLevel,
    example: AssessmentLevel.ADVANCED,
  })
  @IsOptional()
  @IsEnum(AssessmentLevel, {
    message:
      'socioEmotionalLevel must be one of: basic, intermediate, advanced',
  })
  socioEmotionalLevel?: AssessmentLevel;

  @ApiPropertyOptional({
    description: 'Objetivo profesional declarado por el usuario.',
    example: 'Convertirme en frontend senior con foco en accesibilidad.',
  })
  @IsOptional()
  @IsString()
  careerGoal?: string;

  @ApiProperty({
    description: 'Respuestas libres utilizadas para generar la evaluacion.',
    example: {
      strengths: ['communication', 'teamwork'],
      experienceYears: 4,
    },
  })
  @IsObject()
  answers!: Record<string, unknown>;
}
