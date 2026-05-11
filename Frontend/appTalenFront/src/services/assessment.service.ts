import api from '../feactures/api/axiosInterface';
import { throwBackendError } from './api-error';
import type {
  Assessment,
  CreateAssessmentDto,
} from '../types/assessment.types';

export const createMyAssessment = async (
  data: CreateAssessmentDto,
): Promise<Assessment> => {
  try {
    const response = await api.post<Assessment>('/assessments/me', data);
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const getMyAssessments = async (): Promise<Assessment[]> => {
  try {
    const response = await api.get<Assessment[]>('/assessments/me');
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const getMyLatestAssessment = async (): Promise<Assessment> => {
  try {
    const response = await api.get<Assessment>('/assessments/me/latest');
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};
