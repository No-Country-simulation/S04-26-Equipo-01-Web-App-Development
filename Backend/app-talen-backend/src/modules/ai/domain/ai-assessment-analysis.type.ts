export type AiSuggestedModule = {
  title: string;
  category: 'digital' | 'cognitive' | 'socio_emotional';
  description: string;
  durationMin: number;
};

export type AiSuggestedSkill = {
  name: string;
  category: string;
  level: 'INITIAL' | 'MEDIUM' | 'ADVANCED';
};

export type AiAssessmentAnalysis = {
  summary: string;
  detectedGaps: {
    gaps: string[];
    recommendedFocus: string[];
    riskFactors: string[];
    recommendedModules: AiSuggestedModule[];
    suggestedSkills: AiSuggestedSkill[];
  };
};
