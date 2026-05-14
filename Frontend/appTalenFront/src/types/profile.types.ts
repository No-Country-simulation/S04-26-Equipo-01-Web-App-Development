export const WorkModality = {
  VIRTUAL: 'VIRTUAL',
  HIBRIDO: 'HIBRIDO',
  PRESENCIAL: 'PRESENCIAL',
} as const;

export type WorkModality = (typeof WorkModality)[keyof typeof WorkModality];

export const InterestedRole = {
  BACKEND_DEVELOPER: 'BACKEND_DEVELOPER',
  FRONTEND_DEVELOPER: 'FRONTEND_DEVELOPER',
  FULLSTACK_DEVELOPER: 'FULLSTACK_DEVELOPER',
  QA_TESTER: 'QA_TESTER',
  DATA_ANALYST: 'DATA_ANALYST',
  UX_UI_DESIGNER: 'UX_UI_DESIGNER',
  SUPPORT_IT: 'SUPPORT_IT',
  CYBERSECURITY_TRAINEE: 'CYBERSECURITY_TRAINEE',
} as const;

export type InterestedRole =
  (typeof InterestedRole)[keyof typeof InterestedRole];

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  ageRange?: string;
  location?: string;
  country?: string;
  preferredModality?: WorkModality;
  interestedRoles: InterestedRole[];
  currentStatus?: string;
  headline?: string;
  professionalBio?: string;
  yearsExperience?: number;
  employabilityScore: number;
}

export interface CreateProfileDto {
  fullName: string;
  ageRange?: string;
  location?: string;
  currentStatus?: string;
  headline?: string;
  professionalBio?: string;
  yearsExperience?: number;
}

export type UpdateProfileDto = Partial<CreateProfileDto>;

export interface UpdateWorkPreferencesDto {
  country?: string;
  preferredModality?: WorkModality;
}

export interface UpdateInterestedRolesDto {
  interestedRoles: InterestedRole[];
}

export interface CvProfileSuggestions {
  fullName?: string;
  location?: string;
  country?: string;
  preferredModality?: WorkModality;
  headline?: string;
  professionalBio?: string;
  yearsExperience?: number;
  interestedRoles?: InterestedRole[];
}

export interface CvAssessmentSuggestions {
  digitalLevel?: 'basic' | 'intermediate' | 'advanced';
  cognitiveLevel?: 'basic' | 'intermediate' | 'advanced';
  socioEmotionalLevel?: 'basic' | 'intermediate' | 'advanced';
  careerGoal?: string;
  answers: Record<string, unknown>;
}

export interface CvSkillSuggestion {
  name: string;
  category: string;
  level: 'INITIAL' | 'MEDIUM' | 'ADVANCED';
}

export interface CvAnalysisResponse {
  summary: string;
  profileSuggestions: CvProfileSuggestions;
  assessmentSuggestions: CvAssessmentSuggestions;
  suggestedSkills: CvSkillSuggestion[];
  fileName?: string;
  extractedTextLength: number;
  appliedFields: string[];
  updatedProfile?: Profile;
  diagnosticId?: string;
}

export interface SaveCvDiagnosticDto {
  fileName?: string;
  rawText?: string;
  summary?: string;
  profile: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    title?: string;
    professionalSummary?: string;
  };
  skills: {
    technical: string[];
    personal: string[];
  };
  experience?: Array<{
    company: string;
    position: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    highlights?: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    details?: string;
    status?: string;
  }>;
  aiAnalysis?: Record<string, unknown>;
}

export interface CvDiagnostic {
  id: string;
  profileId: string;
  fileName?: string;
  extractedTextLength: number;
  rawText?: string;
  summary?: string;
  technicalSkills: string[];
  personalSkills: string[];
  snapshot?: Record<string, unknown>;
  aiAnalysis?: Record<string, unknown>;
  createdAt: string;
}

export interface AnalyzeCvTextDto {
  extractedText: string;
  applyToProfile?: boolean;
}

export interface AnalyzeCvFileDto {
  file: File;
  applyToProfile?: boolean;
  extractedText?: string;
}
