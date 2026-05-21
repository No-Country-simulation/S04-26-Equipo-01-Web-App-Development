export const AssessmentLevel = {
  BASIC: 'basic',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

export type AssessmentLevel =
  (typeof AssessmentLevel)[keyof typeof AssessmentLevel];

export interface AiSuggestedModule {
  title: string;
  category: 'digital' | 'cognitive' | 'socio_emotional';
  description: string;
  durationMin: number;
}

export interface AiSuggestedSkill {
  name: string;
  category: string;
  level: 'INITIAL' | 'MEDIUM' | 'ADVANCED';
}

export interface AssessmentDetectedGaps {
  gaps: string[];
  recommendedFocus: string[];
  riskFactors: string[];
  recommendedTrack: string;
  confidence: number;
  matchingReason: string;
  alternativeTracks: Array<{
    name: string;
    confidence: number;
  }>;
  recommendedModules: AiSuggestedModule[];
  suggestedSkills: AiSuggestedSkill[];
}

export interface Assessment {
  id: string;
  profileId: string;
  digitalLevel?: AssessmentLevel;
  cognitiveLevel?: AssessmentLevel;
  socioEmotionalLevel?: AssessmentLevel;
  careerGoal?: string;
  answers: Record<string, unknown>;
  aiSummary?: string | null;
  detectedGaps?: AssessmentDetectedGaps | null;
  createdAt: string;
}

export interface CreateAssessmentDto {
  digitalLevel?: AssessmentLevel;
  cognitiveLevel?: AssessmentLevel;
  socioEmotionalLevel?: AssessmentLevel;
  careerGoal?: string;
  answers: Record<string, unknown>;
}

export const AssessmentTestType = {
  PSYCHOTECHNICAL: 'PSYCHOTECHNICAL',
  TECHNICAL: 'TECHNICAL',
} as const;

export type AssessmentTestType =
  (typeof AssessmentTestType)[keyof typeof AssessmentTestType];

export const AssessmentTestResult = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type AssessmentTestResult =
  (typeof AssessmentTestResult)[keyof typeof AssessmentTestResult];

export interface AssessmentQuestionOption {
  value: string;
  label: string;
}

export interface AssessmentTestQuestion {
  id: string;
  text: string;
  category: string;
  type: 'single_choice';
  options: AssessmentQuestionOption[];
}

export interface AssessmentTestResultEntity {
  id: string;
  profileId: string;
  type: AssessmentTestType;
  title: string;
  answers: Record<string, unknown>;
  score: number;
  maxScore: number;
  percentage: number;
  result: AssessmentTestResult;
  feedback?: string | null;
  createdAt: string;
}

export interface SubmitAssessmentTestDto {
  answers: Record<string, string>;
}

export interface CreateAssessmentTestDto {
  title: string;
  answers: Record<string, unknown>;
  score: number;
  maxScore?: number;
  feedback?: string;
}

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

export interface GeneratedTestsResponseDto {
  psychotechnicalTests: GeneratedTest[];
  technicalTests: GeneratedTest[];
  totalTests: number;
  profile: {
    fullName: string;
    technicalSkillsCount: number;
    totalQuestionsCount: number;
  };
}
