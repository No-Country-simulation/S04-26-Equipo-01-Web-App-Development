import api from '../features/api/axiosInterface';
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

const getStoredAuthUserId = (): string | null => {
  try {
    const raw = localStorage.getItem('authUser');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string };
    return parsed.id ?? null;
  } catch {
    return null;
  }
};

const buildFallbackGeneratedTests = (
  technicalQuestions: AssessmentTestQuestion[],
  psychotechnicalQuestions: AssessmentTestQuestion[],
): GeneratedTestsResponseDto => {
  const technicalTest = technicalQuestions.length
    ? [
        {
          id: 'technical-fallback-generated',
          name: 'Prueba tecnica inicial',
          description:
            'Evaluacion tecnica generada con preguntas base disponibles en backend.',
          type: 'TECHNICAL' as const,
          questionCount: technicalQuestions.length,
          estimatedDurationMin: Math.max(10, Math.ceil(technicalQuestions.length * 1.5)),
          questions: technicalQuestions,
        },
      ]
    : [];

  const psychotechnicalTest = psychotechnicalQuestions.length
    ? [
        {
          id: 'psychotechnical-fallback-generated',
          name: 'Prueba psicotecnica inicial',
          description:
            'Evaluacion psicotecnica generada con preguntas base disponibles en backend.',
          type: 'PSYCHOTECHNICAL' as const,
          questionCount: psychotechnicalQuestions.length,
          estimatedDurationMin: Math.max(10, Math.ceil(psychotechnicalQuestions.length * 1.5)),
          questions: psychotechnicalQuestions,
        },
      ]
    : [];

  return {
    psychotechnicalTests: psychotechnicalTest,
    technicalTests: technicalTest,
    totalTests: technicalTest.length + psychotechnicalTest.length,
    profile: {
      fullName: 'Talento',
      technicalSkillsCount: technicalQuestions.length > 0 ? 1 : 0,
      totalQuestionsCount: technicalQuestions.length + psychotechnicalQuestions.length,
    },
  };
};

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
    const authUserId = getStoredAuthUserId();
    if (authUserId) {
      try {
        const recruiterResponse = await api.get<AssessmentTestResultEntity[]>(
          `/recruiter/candidates/${authUserId}/assessment-results`,
        );
        return recruiterResponse.data;
      } catch {
        return throwBackendError(error);
      }
    }

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
    const allResults = await getMyAssessmentTestResults().catch(() => []);
    if (!allResults.length) {
      return throwBackendError(error);
    }

    const sorted = [...allResults].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    return sorted.slice(0, 2);
  }
};

export const generateTestsForProfile = async (): Promise<GeneratedTestsResponseDto> => {
  try {
    const response = await api.post<GeneratedTestsResponseDto>(
      '/assessments/me/generate-tests',
    );
    return response.data;
  } catch (error: unknown) {
    const [technicalQuestions, psychotechnicalQuestions] = await Promise.all([
      getTechnicalTestQuestions().catch(() => []),
      getPsychotechnicalTestQuestions().catch(() => []),
    ]);

    if (technicalQuestions.length === 0 && psychotechnicalQuestions.length === 0) {
      return throwBackendError(error);
    }

    return buildFallbackGeneratedTests(technicalQuestions, psychotechnicalQuestions);
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
  return getMyLatestAssessmentTestResults();
};

export const getMyAllTestResults = async (): Promise<
  AssessmentTestResultEntity[]
> => {
  return getMyAssessmentTestResults();
};

export const consolidateMyAssessment = async (): Promise<Assessment> => {
  try {
    const response = await api.post<Assessment>('/assessments/me/consolidate');
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

