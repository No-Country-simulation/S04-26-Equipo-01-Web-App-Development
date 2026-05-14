import { AssessmentTestQuestion } from '../../domain/assessment-test-question.type';
import { AssessmentTestType } from '../../domain/assessment-test-type.enum';

export interface GeneratedTest {
  id: string;
  name: string;
  description: string;
  type: AssessmentTestType;
  skillName?: string;
  questionCount: number;
  estimatedDurationMin: number;
  questions: AssessmentTestQuestion[];
}

export class GeneratedTestsResponseDto {
  psychotechnicalTests!: GeneratedTest[];
  technicalTests!: GeneratedTest[];
  totalTests!: number;
  profile!: {
    fullName: string;
    technicalSkillsCount: number;
    totalQuestionsCount: number;
  };
}
