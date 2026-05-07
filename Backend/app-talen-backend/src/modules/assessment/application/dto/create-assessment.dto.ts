import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { AssessmentLevel } from '../../domain/assessment-level.enum';

export class CreateAssessmentDto {
  @IsOptional()
  @IsEnum(AssessmentLevel, {
    message: 'digitalLevel must be one of: basic, intermediate, advanced',
  })
  digitalLevel?: AssessmentLevel;

  @IsOptional()
  @IsEnum(AssessmentLevel, {
    message: 'cognitiveLevel must be one of: basic, intermediate, advanced',
  })
  cognitiveLevel?: AssessmentLevel;

  @IsOptional()
  @IsEnum(AssessmentLevel, {
    message:
      'socioEmotionalLevel must be one of: basic, intermediate, advanced',
  })
  socioEmotionalLevel?: AssessmentLevel;

  @IsOptional()
  @IsString()
  careerGoal?: string;

  @IsObject()
  answers!: Record<string, unknown>;
}
