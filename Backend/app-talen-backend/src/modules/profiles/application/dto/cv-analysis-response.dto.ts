import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssessmentLevel } from '../../../assessment/domain/assessment-level.enum';
import { InterestedRole } from '../../domain/interested-role.enum';
import { WorkModality } from '../../domain/work-modality.enum';
import { SkillLevel } from '../../../skills/domain/skill-level.enum';
import { Profile } from '../../infrastructure/entities/profile.entity';

class CvProfileSuggestionsDto {
  @ApiPropertyOptional({ example: 'Ada Lovelace' })
  fullName?: string;

  @ApiPropertyOptional({ example: 'Buenos Aires, Argentina' })
  location?: string;

  @ApiPropertyOptional({ example: 'Argentina' })
  country?: string;

  @ApiPropertyOptional({ enum: WorkModality, example: WorkModality.HIBRIDO })
  preferredModality?: WorkModality;

  @ApiPropertyOptional({ example: 'Frontend Developer' })
  headline?: string;

  @ApiPropertyOptional({
    example: 'Frontend profile focused on accessibility.',
  })
  professionalBio?: string;

  @ApiPropertyOptional({ example: 5 })
  yearsExperience?: number;

  @ApiPropertyOptional({
    enum: InterestedRole,
    isArray: true,
    example: [InterestedRole.FRONTEND_DEVELOPER, InterestedRole.UX_UI_DESIGNER],
  })
  interestedRoles?: InterestedRole[];
}

class CvAssessmentSuggestionsDto {
  @ApiPropertyOptional({
    enum: AssessmentLevel,
    example: AssessmentLevel.INTERMEDIATE,
  })
  digitalLevel?: AssessmentLevel;

  @ApiPropertyOptional({
    enum: AssessmentLevel,
    example: AssessmentLevel.BASIC,
  })
  cognitiveLevel?: AssessmentLevel;

  @ApiPropertyOptional({
    enum: AssessmentLevel,
    example: AssessmentLevel.INTERMEDIATE,
  })
  socioEmotionalLevel?: AssessmentLevel;

  @ApiPropertyOptional({ example: 'Become a senior frontend engineer' })
  careerGoal?: string;

  @ApiProperty({
    description: 'Respuesta libre utilizada por el modelo para el análisis.',
    example: { q1: 'Sí', q2: 'No' },
  })
  answers!: Record<string, unknown>;
}

class CvSkillSuggestionDto {
  @ApiProperty({ example: 'React' })
  name!: string;

  @ApiProperty({ example: 'technical' })
  category!: string;

  @ApiProperty({ enum: SkillLevel, example: SkillLevel.ADVANCED })
  level!: SkillLevel;
}

export class CvAnalysisResponseDto {
  @ApiProperty({
    example: 'Frontend profile with strong React and accessibility background.',
  })
  summary!: string;

  @ApiProperty({ type: () => CvProfileSuggestionsDto })
  profileSuggestions!: CvProfileSuggestionsDto;

  @ApiProperty({ type: () => CvAssessmentSuggestionsDto })
  assessmentSuggestions!: CvAssessmentSuggestionsDto;

  @ApiProperty({ type: () => CvSkillSuggestionDto, isArray: true })
  suggestedSkills!: CvSkillSuggestionDto[];

  @ApiPropertyOptional({ example: 'ada-lovelace-cv.pdf' })
  fileName?: string;

  @ApiProperty({ example: 5420 })
  extractedTextLength!: number;

  @ApiProperty({ example: ['professionalBio', 'headline'], isArray: true })
  appliedFields!: string[];

  @ApiPropertyOptional({ type: () => Profile })
  updatedProfile?: Profile;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440010' })
  diagnosticId?: string;
}
