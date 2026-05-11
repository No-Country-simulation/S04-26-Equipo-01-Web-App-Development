import api from '../feactures/api/axiosInterface';
import { throwBackendError } from './api-error';
import type {
  GenerateLearningPathDto,
  LearningModule,
  LearningPath,
  UpdateModuleProgressDto,
  UserModuleProgress,
} from '../types/learning.types';

export const generateMyLearningPath = async (
  data: GenerateLearningPathDto = {},
): Promise<LearningPath> => {
  try {
    const response = await api.post<LearningPath>(
      '/learning-paths/me/generate',
      data,
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const getMyLearningPaths = async (): Promise<LearningPath[]> => {
  try {
    const response = await api.get<LearningPath[]>('/learning-paths/me');
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const getMyLearningModules = async (): Promise<LearningModule[]> => {
  try {
    const response = await api.get<LearningModule[]>('/learning-modules/me');
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const updateMyModuleProgress = async (
  moduleId: string,
  data: UpdateModuleProgressDto,
): Promise<UserModuleProgress> => {
  try {
    const response = await api.patch<UserModuleProgress>(
      `/learning-modules/${moduleId}/progress`,
      data,
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};
