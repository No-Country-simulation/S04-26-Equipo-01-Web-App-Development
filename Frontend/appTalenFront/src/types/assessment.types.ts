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
