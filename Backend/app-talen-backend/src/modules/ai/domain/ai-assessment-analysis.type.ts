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

export type AiAlternativeTrack = {
  name: string;
  confidence: number;
};

export type AiAssessmentAnalysis = {
  summary: string;
  detectedGaps: {
    gaps: string[];
    recommendedFocus: string[];
    riskFactors: string[];
    recommendedTrack: string;
    confidence: number;
    matchingReason: string;
    alternativeTracks: AiAlternativeTrack[];
    recommendedModules: AiSuggestedModule[];
    suggestedSkills: AiSuggestedSkill[];
  };
};
