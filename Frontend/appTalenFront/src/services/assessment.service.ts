import api from '../features/api/axiosInterface';
import { throwBackendError } from './api-error';
import type {
  Assessment,
  AssessmentTestQuestion,
  AssessmentTestResultEntity,
  CreateAssessmentTestDto,
  CreateAssessmentDto,
  GenerateTestsForProfileDto,
  SubmitAssessmentTestDto,
  GeneratedTestsResponseDto,
  GeneratedTest,
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

const normalizeForMatch = (value?: string): string =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const uniqueStrings = (values: Array<string | undefined | null>): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0),
    ),
  );

const expandKeywords = (values: Array<string | undefined>): string[] => {
  const rawKeywords = uniqueStrings(values);
  const fragments = rawKeywords.flatMap((value) =>
    value
      .split(/[/|,()-]/)
      .flatMap((part) => part.split(/\s+/))
      .map((part) => part.trim())
      .filter((part) => part.length >= 3),
  );

  return uniqueStrings([...rawKeywords, ...fragments]).map((value) => normalizeForMatch(value));
};

const questionMatchesKeywords = (
  question: AssessmentTestQuestion,
  keywords: string[],
): boolean => {
  if (keywords.length === 0) {
    return false;
  }

  const haystack = normalizeForMatch(`${question.category} ${question.text}`);
  return keywords.some((keyword) => haystack.includes(keyword));
};

const hasGenerationContext = (data?: GenerateTestsForProfileDto): boolean =>
  Boolean(
    data?.professionalArea ||
      data?.headline ||
      data?.technicalSkills?.length ||
      data?.interestedRoles?.length,
  );

const buildTechnicalFallbackTests = (
  technicalQuestions: AssessmentTestQuestion[],
  context?: GenerateTestsForProfileDto,
): GeneratedTest[] => {
  if (technicalQuestions.length === 0) {
    return [];
  }

  const tests: GeneratedTest[] = [];
  const usedQuestionIds = new Set<string>();
  const technicalSkills = uniqueStrings(context?.technicalSkills ?? []).slice(0, 5);

  technicalSkills.forEach((skill, index) => {
    const matchingQuestions = technicalQuestions.filter(
      (question) =>
        !usedQuestionIds.has(question.id) &&
        questionMatchesKeywords(question, expandKeywords([skill])),
    );

    if (matchingQuestions.length === 0) {
      return;
    }

    matchingQuestions.slice(0, 6).forEach((question) => usedQuestionIds.add(question.id));
    const selectedQuestions = matchingQuestions.slice(0, 6);

    tests.push({
      id: `technical-fallback-skill-${index + 1}`,
      name: `Prueba tecnica de ${skill}`,
      description: context?.professionalArea
        ? `Evaluacion tecnica enfocada en ${skill} para el area ${context.professionalArea}.`
        : `Evaluacion tecnica enfocada en la skill ${skill}.`,
      type: 'TECHNICAL',
      skillName: skill,
      questionCount: selectedQuestions.length,
      estimatedDurationMin: Math.max(10, Math.ceil(selectedQuestions.length * 1.5)),
      questions: selectedQuestions,
    });
  });

  if (tests.length > 0) {
    return tests;
  }

  const areaKeywords = expandKeywords([
    context?.professionalArea,
    context?.headline,
    ...(context?.interestedRoles ?? []),
  ]);
  const areaQuestions = technicalQuestions.filter((question) =>
    questionMatchesKeywords(question, areaKeywords),
  );

  if (areaQuestions.length > 0) {
    const selectedQuestions = areaQuestions.slice(0, 8);
    return [
      {
        id: 'technical-fallback-area',
        name: context?.professionalArea
          ? `Prueba tecnica para ${context.professionalArea}`
          : 'Prueba tecnica contextual',
        description: context?.professionalArea
          ? `Evaluacion tecnica alineada con el area profesional ${context.professionalArea}.`
          : 'Evaluacion tecnica contextual basada en el perfil profesional.',
        type: 'TECHNICAL',
        questionCount: selectedQuestions.length,
        estimatedDurationMin: Math.max(10, Math.ceil(selectedQuestions.length * 1.5)),
        questions: selectedQuestions,
      },
    ];
  }

  const genericQuestions = technicalQuestions.slice(0, 8);
  return [
    {
      id: 'technical-fallback-generated',
      name: 'Prueba tecnica inicial',
      description:
        'Evaluacion tecnica generada con preguntas base disponibles en backend.',
      type: 'TECHNICAL',
      questionCount: genericQuestions.length,
      estimatedDurationMin: Math.max(10, Math.ceil(genericQuestions.length * 1.5)),
      questions: genericQuestions,
    },
  ];
};

const buildFallbackGeneratedTests = (
  technicalQuestions: AssessmentTestQuestion[],
  psychotechnicalQuestions: AssessmentTestQuestion[],
  context?: GenerateTestsForProfileDto,
): GeneratedTestsResponseDto => {
  const technicalTest = buildTechnicalFallbackTests(technicalQuestions, context);

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
      technicalSkillsCount: uniqueStrings(context?.technicalSkills ?? []).length,
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

export const getTechnicalTestQuestionsForContext = async (
  data?: GenerateTestsForProfileDto,
): Promise<AssessmentTestQuestion[]> => {
  try {
    const response = await api.get<AssessmentTestQuestion[]>(
      '/assessments/technical-tests/questions',
      {
        params: hasGenerationContext(data)
          ? {
              technicalSkills: data?.technicalSkills?.join(','),
              professionalArea: data?.professionalArea,
              headline: data?.headline,
              interestedRoles: data?.interestedRoles?.join(','),
            }
          : undefined,
      },
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

export const generateTestsForProfile = async (
  data?: GenerateTestsForProfileDto,
): Promise<GeneratedTestsResponseDto> => {
  try {
    const response = await api.post<GeneratedTestsResponseDto>(
      '/assessments/me/generate-tests',
      hasGenerationContext(data) ? data : {},
    );
    return response.data;
  } catch (error: unknown) {
    if (hasGenerationContext(data)) {
      try {
        const legacyResponse = await api.post<GeneratedTestsResponseDto>(
          '/assessments/me/generate-tests',
          {},
        );
        return legacyResponse.data;
      } catch {
        // continue with contextual fallback below
      }
    }

    const [technicalQuestions, psychotechnicalQuestions] = await Promise.all([
      getTechnicalTestQuestionsForContext(data).catch(() => []),
      getPsychotechnicalTestQuestions().catch(() => []),
    ]);

    if (technicalQuestions.length === 0 && psychotechnicalQuestions.length === 0) {
      return throwBackendError(error);
    }

    return buildFallbackGeneratedTests(technicalQuestions, psychotechnicalQuestions, data);
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
