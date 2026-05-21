import api from '../feactures/api/axiosInterface';

export interface CandidateProfile {
  id: string;
  name: string;
  fullName?: string;
  title: string;
  headline?: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: Array<{
    id: string;
    name: string;
    category: string;
    level: number;
  }>;
  cv?: {
    url: string;
    uploadedAt: string;
  };
  assessmentResults?: Array<{
    id: string;
    type: 'technical' | 'psychotechnical';
    score: number;
    completedAt: string;
  }>;
  learningPath?: {
    id: string;
    status: string;
    progress: number;
  };
  courses?: Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
  }>;
  employabilityScore?: number;
  interestedRoles?: string[];
}

export interface CandidateSkill {
  id: string;
  name: string;
  category: string;
  level: number;
  yearsOfExperience?: number;
  validated?: boolean;
}

export interface CandidateAssessmentResult {
  id: string;
  type: 'technical' | 'psychotechnical' | 'TECHNICAL' | 'PSYCHOTECHNICAL';
  testName: string;
  score: number;
  percentage?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  completedAt: string;
  duration?: number;
  feedback?: string;
  dimensions?: Record<string, number>;
}

export interface CandidateCvData {
  id?: string;
  url: string;
  uploadedAt: string;
  fileName?: string | null;
  summary?: string | null;
  technicalSkills?: string[];
  personalSkills?: string[];
  snapshot?: {
    profile?: {
      fullName?: string;
      email?: string;
      phone?: string;
      location?: string;
      title?: string;
      professionalSummary?: string;
    };
    skills?: {
      technical?: string[];
      personal?: string[];
    };
    experience?: Array<{
      company?: string;
      position?: string;
      startDate?: string;
      endDate?: string;
      description?: string;
      highlights?: string[];
    }>;
    education?: Array<{
      institution?: string;
      degree?: string;
      details?: string;
      status?: string;
    }>;
  } | null;
  parsed?: {
    profile?: {
      fullName?: string;
      email?: string;
      phone?: string;
      location?: string;
      title?: string;
      summary?: string;
      professionalSummary?: string;
    };
    experience?: Array<{
      company?: string;
      position?: string;
      startDate?: string;
      endDate?: string;
      description?: string;
      highlights?: string[];
    }>;
    education?: Array<{
      institution?: string;
      degree?: string;
      details?: string;
      status?: string;
    }>;
    skills?: {
      technical?: string[];
      personal?: string[];
    };
  } | null;
}

export interface CandidateCourseData {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  modules: number;
  completedModules: number;
  startedAt?: string;
  instructor?: string;
  company?: string;
}

export interface CandidateSearchFilters {
  name?: string;
  title?: string;
  skill?: string;
  minScore?: number;
  status?: string;
}

export interface CreateRecruiterRequestPayload {
  title: string;
  area: string;
  modality: 'remote' | 'hybrid' | 'onsite';
  location: string;
  contractType: 'full-time' | 'part-time' | 'contractor' | 'internship';
  seniority: 'junior' | 'mid' | 'senior' | 'lead';
  vacancies: number;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  responsibilities: string[];
  requiredSkills: string[];
  optionalSkills: string[];
}

export interface RecruiterVacancy {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  location?: string;
  modality?: string;
  vacancies?: number;
  createdAt: string;
}

export interface CreateVacancyPayload {
  title: string;
  description: string;
  requiredSkills: string[];
  location?: string;
  modality?: string;
  vacancies?: number;
}

export interface VacancyPipelineCandidate {
  id: string;
  fullName: string;
  title: string;
  location: string;
  skillsValidated: string[];
  matchedSkills: string[];
  matchCount: number;
}

export interface VacancyPipeline {
  vacancyId: string;
  vacancyTitle: string;
  vacanciesLimit: number;
  preselected: VacancyPipelineCandidate[];
  selected: VacancyPipelineCandidate[];
  finalists: VacancyPipelineCandidate[];
  accepted: VacancyPipelineCandidate[];
}

export interface RecruiterSkillOption {
  id: string;
  name: string;
  category: string;
}

export interface CreateRecruiterSkillPayload {
  name: string;
  category?: string;
}

/**
 * Obtiene lista de candidatos que el reclutador puede ver
 * Endpoint: GET /recruiter/candidates
 */
export const getCandidates = async (
  filters?: CandidateSearchFilters,
): Promise<CandidateProfile[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.name) params.append('name', filters.name);
    if (filters?.title) params.append('title', filters.title);
    if (filters?.skill) params.append('skill', filters.skill);
    if (filters?.minScore !== undefined) params.append('minScore', String(filters.minScore));
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get<CandidateProfile[] | { data?: CandidateProfile[]; items?: CandidateProfile[]; candidates?: CandidateProfile[] }>(
      `/recruiter/candidates?${params.toString()}`,
    );
    const payload = response.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.candidates)) return payload.candidates;
    return [];
  } catch (error: unknown) {
    console.warn('Recruiter candidates endpoint not available', error);
    return [];
  }
};

/**
 * Obtiene detalles de un candidato específico
 * Endpoint: GET /recruiter/candidates/:candidateId
 */
export const getCandidateDetails = async (
  candidateId: string,
): Promise<CandidateProfile | null> => {
  try {
    const response = await api.get<CandidateProfile>(
      `/recruiter/candidates/${candidateId}`,
    );
    return response.data || null;
  } catch (error: unknown) {
    console.warn(`Recruiter candidate ${candidateId} details not available`, error);
    return null;
  }
};

/**
 * Obtiene skills de un candidato
 * Endpoint: GET /recruiter/candidates/:candidateId/skills
 */
export const getCandidateSkills = async (
  candidateId: string,
): Promise<CandidateSkill[]> => {
  try {
    const response = await api.get<CandidateSkill[]>(
      `/recruiter/candidates/${candidateId}/skills`,
    );
    return response.data || [];
  } catch (error: unknown) {
    console.warn(`Recruiter candidate ${candidateId} skills not available`, error);
    return [];
  }
};

/**
 * Obtiene CV de un candidato
 * Endpoint: GET /recruiter/candidates/:candidateId/cv
 */
export const getCandidateCv = async (
  candidateId: string,
): Promise<CandidateCvData | null> => {
  try {
    const response = await api.get<CandidateCvData>(
      `/recruiter/candidates/${candidateId}/cv`,
    );
    return response.data || null;
  } catch (error: unknown) {
    console.warn(`Recruiter candidate ${candidateId} CV not available`, error);
    return null;
  }
};

/**
 * Obtiene resultados de pruebas de un candidato
 * Endpoint: GET /recruiter/candidates/:candidateId/assessment-results
 */
export const getCandidateAssessmentResults = async (
  candidateId: string,
): Promise<CandidateAssessmentResult[]> => {
  try {
    const response = await api.get<CandidateAssessmentResult[]>(
      `/recruiter/candidates/${candidateId}/assessment-results`,
    );
    const normalized = (response.data || []).map((item) => ({
      ...item,
      type:
        item.type === 'TECHNICAL'
          ? 'technical'
          : item.type === 'PSYCHOTECHNICAL'
            ? 'psychotechnical'
            : item.type,
      score: item.percentage ?? item.score,
    }));
    return normalized;
  } catch (error: unknown) {
    console.warn(
      `Recruiter candidate ${candidateId} assessment results not available`,
      error,
    );
    return [];
  }
};

/**
 * Obtiene ruta de aprendizaje de un candidato
 * Endpoint: GET /recruiter/candidates/:candidateId/learning-path
 */
export const getCandidateLearningPath = async (candidateId: string) => {
  try {
    const response = await api.get(
      `/recruiter/candidates/${candidateId}/learning-path`,
    );
    return response.data || null;
  } catch (error: unknown) {
    console.warn(
      `Recruiter candidate ${candidateId} learning path not available`,
      error,
    );
    return null;
  }
};

/**
 * Obtiene cursos de un candidato
 * Endpoint: GET /recruiter/candidates/:candidateId/courses
 */
export const getCandidateCourses = async (
  candidateId: string,
): Promise<CandidateCourseData[]> => {
  try {
    const response = await api.get<CandidateCourseData[]>(
      `/recruiter/candidates/${candidateId}/courses`,
    );
    return response.data || [];
  } catch (error: unknown) {
    console.warn(
      `Recruiter candidate ${candidateId} courses not available`,
      error,
    );
    return [];
  }
};

/**
 * Obtiene perfil consolidado de un candidato con todos sus datos
 * Endpoint: GET /recruiter/candidates/:candidateId/consolidated
 * Si no existe, obtiene datos individuales en paralelo
 */
export const getCandidateConsolidatedData = async (candidateId: string) => {
  try {
    // Intentar obtener datos consolidados
    const consolidatedResponse = await api.get(
      `/recruiter/candidates/${candidateId}/consolidated`,
    );
    return consolidatedResponse.data || null;
  } catch (error) {
    // Si no existe endpoint consolidado, traer datos individuales en paralelo
    console.warn('Consolidated endpoint not available, fetching individual data', error);
    try {
      const [profile, skills, cv, assessmentResults, learningPath, courses] =
        await Promise.all([
          getCandidateDetails(candidateId),
          getCandidateSkills(candidateId),
          getCandidateCv(candidateId),
          getCandidateAssessmentResults(candidateId),
          getCandidateLearningPath(candidateId),
          getCandidateCourses(candidateId),
        ]);

      return {
        profile,
        skills: skills || [],
        cv,
        assessmentResults: assessmentResults || [],
        learningPath,
        courses: courses || [],
      };
    } catch (innerError) {
      console.error('Error fetching individual candidate data:', innerError);
      return null;
    }
  }
};

export const getVacancyPipeline = async (
  vacancyId: string,
): Promise<VacancyPipeline | null> => {
  try {
    const response = await api.get<VacancyPipeline>(
      `/recruiter/vacancies/${vacancyId}/pipeline`,
    );
    return response.data || null;
  } catch (error: unknown) {
    console.warn(`Recruiter vacancy ${vacancyId} pipeline not available`, error);
    return null;
  }
};

export const moveCandidateToSelected = async (
  vacancyId: string,
  candidateId: string,
) => {
  const response = await api.post(
    `/recruiter/vacancies/${vacancyId}/candidates/${candidateId}/select`,
  );
  return response.data;
};

export const moveCandidateToFinalist = async (
  vacancyId: string,
  candidateId: string,
) => {
  const response = await api.post(
    `/recruiter/vacancies/${vacancyId}/candidates/${candidateId}/finalist`,
  );
  return response.data;
};

export const acceptFinalistCandidate = async (
  vacancyId: string,
  candidateId: string,
) => {
  const response = await api.post(
    `/recruiter/vacancies/${vacancyId}/candidates/${candidateId}/accept`,
  );
  return response.data;
};

/**
 * Crea una nueva solicitud de reclutamiento.
 * Prueba endpoints alternativos para compatibilidad entre ambientes.
 */
export const createRecruiterRequest = async (
  payload: CreateRecruiterRequestPayload,
) => {
  const vacancyPayload: CreateVacancyPayload = {
    title: payload.title,
    description: payload.description,
    requiredSkills: payload.requiredSkills,
    location: payload.location,
    modality: payload.modality,
    vacancies: payload.vacancies,
  };

  const endpoints = ['/recruiter/vacancies', '/recruiter/requests', '/recruiter/vacancies/requests'];

  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const response = await api.post(endpoint, vacancyPayload);
      return response.data;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;

      // Si el endpoint no existe en este backend, probar el siguiente.
      if (status === 404) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError;
};

/**
 * Crea una vacante para la empresa autenticada
 * Endpoint: POST /recruiter/vacancies
 */
export const createVacancy = async (
  payload: CreateVacancyPayload,
): Promise<RecruiterVacancy> => {
  const response = await api.post<RecruiterVacancy>('/recruiter/vacancies', payload);
  return response.data;
};

/**
 * Obtiene catalogo de skills disponibles para vacantes
 * Endpoint: GET /recruiter/skills
 */
export const getRecruiterSkills = async (): Promise<RecruiterSkillOption[]> => {
  try {
    const response = await api.get<RecruiterSkillOption[]>('/recruiter/skills');
    return response.data || [];
  } catch (error: unknown) {
    console.warn('Recruiter skills catalog endpoint not available', error);
    return [];
  }
};

/**
 * Crea una skill para el catalogo de vacantes
 * Endpoint: POST /recruiter/skills
 */
export const createRecruiterSkill = async (
  payload: CreateRecruiterSkillPayload,
) => {
  const response = await api.post('/recruiter/skills', payload);
  return response.data;
};

/**
 * Obtiene vacantes creadas por la empresa autenticada
 * Endpoint: GET /recruiter/vacancies
 */
export const getMyVacancies = async (): Promise<RecruiterVacancy[]> => {
  try {
    const response = await api.get<RecruiterVacancy[]>('/recruiter/vacancies');
    return response.data || [];
  } catch (error: unknown) {
    console.warn('Recruiter vacancies endpoint not available', error);
    return [];
  }
};
