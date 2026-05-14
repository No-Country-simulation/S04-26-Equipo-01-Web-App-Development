import api from '../feactures/api/axiosInterface';
import { throwBackendError } from './api-error';
import type {
  Assessment,
  AssessmentTestQuestion,
  AssessmentTestResultEntity,
  CreateAssessmentTestDto,
  CreateAssessmentDto,
  SubmitAssessmentTestDto,
  GeneratedTestsResponseDto,
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

export const getPsychotechnicalTestQuestions = async (): Promise<
  AssessmentTestQuestion[]
> => {
  try {
    const response = await api.get<AssessmentTestQuestion[]>(
      '/assessments/psychotechnical-tests/questions',
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const getTechnicalTestQuestions = async (): Promise<
  AssessmentTestQuestion[]
> => {
  try {
    const response = await api.get<AssessmentTestQuestion[]>(
      '/assessments/technical-tests/questions',
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const submitMyPsychotechnicalTest = async (
  data: SubmitAssessmentTestDto,
): Promise<AssessmentTestResultEntity> => {
  try {
    const response = await api.post<AssessmentTestResultEntity>(
      '/assessments/me/psychotechnical-tests/submit',
      data,
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const submitMyTechnicalTest = async (
  data: SubmitAssessmentTestDto,
): Promise<AssessmentTestResultEntity> => {
  try {
    const response = await api.post<AssessmentTestResultEntity>(
      '/assessments/me/technical-tests/submit',
      data,
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const createMyPsychotechnicalTestResult = async (
  data: CreateAssessmentTestDto,
): Promise<AssessmentTestResultEntity> => {
  try {
    const response = await api.post<AssessmentTestResultEntity>(
      '/assessments/me/psychotechnical-tests',
      data,
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const createMyTechnicalTestResult = async (
  data: CreateAssessmentTestDto,
): Promise<AssessmentTestResultEntity> => {
  try {
    const response = await api.post<AssessmentTestResultEntity>(
      '/assessments/me/technical-tests',
      data,
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const getMyAssessmentTestResults = async (): Promise<
  AssessmentTestResultEntity[]
> => {
  try {
    const response = await api.get<AssessmentTestResultEntity[]>(
      '/assessments/me/test-results',
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const getMyLatestAssessmentTestResults = async (): Promise<
  AssessmentTestResultEntity[]
> => {
  try {
    const response = await api.get<AssessmentTestResultEntity[]>(
      '/assessments/me/test-results/latest',
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const generateTestsForProfile = async (): Promise<GeneratedTestsResponseDto> => {
  try {
    const response = await api.post<GeneratedTestsResponseDto>(
      '/assessments/me/generate-tests',
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const submitPsychotechnicalTest = async (
  data: SubmitAssessmentTestDto,
): Promise<AssessmentTestResultEntity> => {
  try {
    const response = await api.post<AssessmentTestResultEntity>(
      '/assessments/me/psychotechnical-tests/submit',
      data,
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const submitTechnicalTest = async (
  data: SubmitAssessmentTestDto,
): Promise<AssessmentTestResultEntity> => {
  try {
    const response = await api.post<AssessmentTestResultEntity>(
      '/assessments/me/technical-tests/submit',
      data,
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const getMyLatestTestResults = async (): Promise<
  AssessmentTestResultEntity[]
> => {
  try {
    const response = await api.get<AssessmentTestResultEntity[]>(
      '/assessments/me/test-results/latest',
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const getMyAllTestResults = async (): Promise<
  AssessmentTestResultEntity[]
> => {
  try {
    const response = await api.get<AssessmentTestResultEntity[]>(
      '/assessments/me/test-results',
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const consolidateMyAssessment = async (): Promise<Assessment> => {
  try {
    const response = await api.post<Assessment>('/assessments/me/consolidate');
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

