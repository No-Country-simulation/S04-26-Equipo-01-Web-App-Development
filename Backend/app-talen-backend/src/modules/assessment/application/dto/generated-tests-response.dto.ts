import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssessmentTestType } from '../../domain/assessment-test-type.enum';

export class GeneratedTestsProfileDto {
  @ApiProperty({ example: 'Ada Lovelace' })
  fullName!: string;

  @ApiProperty({ example: 4 })
  technicalSkillsCount!: number;

  @ApiProperty({ example: 20 })
  totalQuestionsCount!: number;
}

export class AssessmentQuestionOptionDto {
  @ApiProperty({ example: 'a' })
  value!: string;

  @ApiProperty({ example: 'GET' })
  label!: string;
}

export class AssessmentTestQuestionDto {
  @ApiProperty({ example: 'tech_api_1' })
  id!: string;

  @ApiProperty({
    example: 'Que metodo HTTP se usa normalmente para crear un recurso?',
  })
  text!: string;

  @ApiProperty({ example: 'api_design' })
  category!: string;

  @ApiProperty({ example: 'single_choice' })
  type!: 'single_choice';

  @ApiProperty({ type: () => AssessmentQuestionOptionDto, isArray: true })
  options!: AssessmentQuestionOptionDto[];
}

export class GeneratedTest {
  @ApiProperty({ example: 'psycho_test_1' })
  id!: string;

  @ApiProperty({ example: 'Test Psicotecnico - Aptitud General' })
  name!: string;

  @ApiProperty({
    example:
      'Evaluacion de razonamiento logico, atencion, toma de decisiones y trabajo en equipo.',
  })
  description!: string;

  @ApiProperty({
    enum: AssessmentTestType,
    example: AssessmentTestType.PSYCHOTECHNICAL,
  })
  type!: AssessmentTestType;

  @ApiPropertyOptional({ example: 'Frontend', nullable: true })
  skillName?: string;

  @ApiProperty({ example: 5 })
  questionCount!: number;

  @ApiProperty({ example: 10 })
  estimatedDurationMin!: number;

  @ApiProperty({ type: () => AssessmentTestQuestionDto, isArray: true })
  questions!: AssessmentTestQuestionDto[];
}

export class GeneratedTestsResponseDto {
  @ApiProperty({ type: () => GeneratedTest, isArray: true })
  psychotechnicalTests!: GeneratedTest[];

  @ApiProperty({ type: () => GeneratedTest, isArray: true })
  technicalTests!: GeneratedTest[];

  @ApiProperty({ example: 3 })
  totalTests!: number;

  @ApiProperty({ type: () => GeneratedTestsProfileDto })
  profile!: GeneratedTestsProfileDto;
}
