import { AssessmentLevel } from '../../assessment/domain/assessment-level.enum';
import { InterestedRole } from '../../profiles/domain/interested-role.enum';
import { WorkModality } from '../../profiles/domain/work-modality.enum';
import { SkillLevel } from '../../skills/domain/skill-level.enum';

export type AiCvProfileSuggestions = {
  fullName?: string;
  location?: string;
  country?: string;
  preferredModality?: WorkModality;
  headline?: string;
  professionalBio?: string;
  yearsExperience?: number;
  interestedRoles?: InterestedRole[];
};

export type AiCvAssessmentSuggestions = {
  digitalLevel?: AssessmentLevel;
  cognitiveLevel?: AssessmentLevel;
  socioEmotionalLevel?: AssessmentLevel;
  careerGoal?: string;
  answers: Record<string, unknown>;
};

export type AiCvSkillSuggestion = {
  name: string;
  category: string;
  level: SkillLevel;
};

export type AiCvAnalysis = {
  summary: string;
  profileSuggestions: AiCvProfileSuggestions;
  assessmentSuggestions: AiCvAssessmentSuggestions;
  suggestedSkills: AiCvSkillSuggestion[];
};
