import type { Skill } from './skill.types';

export const ModuleStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type ModuleStatus = (typeof ModuleStatus)[keyof typeof ModuleStatus];

export const LearningModuleCategory = {
  DIGITAL: 'digital',
  COGNITIVE: 'cognitive',
  SOCIO_EMOTIONAL: 'socio_emotional',
} as const;

export type LearningModuleCategory =
  (typeof LearningModuleCategory)[keyof typeof LearningModuleCategory];

export interface UserModuleProgress {
  id: string;
  profileId: string;
  moduleId: string;
  status: ModuleStatus;
  progress: number;
  completedAt?: string | null;
}

export interface LearningModule {
  id: string;
  learningPathId: string;
  title: string;
  description?: string;
  category: LearningModuleCategory;
  contentUrl?: string | null;
  durationMin?: number;
  order: number;
  progress?: UserModuleProgress[];
  skills?: Skill[];
}

export interface LearningPath {
  id: string;
  profileId: string;
  title: string;
  objective?: string;
  aiGenerated: boolean;
  recommendedTrack?: string;
  confidence?: number;
  matchingReason?: string;
  alternativeTracks?: Array<Record<string, unknown>>;
  createdAt: string;
  modules?: LearningModule[];
}

export interface GenerateLearningPathDto {
  title?: string;
  objective?: string;
}

export interface UpdateModuleProgressDto {
  status?: ModuleStatus;
  progress?: number;
}
