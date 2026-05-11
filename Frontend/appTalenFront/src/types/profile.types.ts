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
