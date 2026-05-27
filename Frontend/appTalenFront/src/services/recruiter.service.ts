import api from '../features/api/axiosInterface';

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
  area?: string;
  description: string;
  requiredSkills: string[];
  optionalSkills?: string[];
  responsibilities?: string[];
  contractType?: string;
  seniority?: string;
  salaryMin?: number;
  salaryMax?: number;
  location?: string;
  modality?: string;
  vacancies?: number;
  createdAt: string;
}

export interface CreateVacancyPayload {
  title: string;
  area?: string;
  description: string;
  requiredSkills: string[];
  optionalSkills?: string[];
  responsibilities?: string[];
  contractType?: 'full-time' | 'part-time' | 'contractor' | 'internship' | string;
  seniority?: 'junior' | 'mid' | 'senior' | 'lead' | string;
  salaryMin?: number;
  salaryMax?: number;
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
  feedback?: string | null;
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

export interface TalentRecruiterFeedback {
  applicationId: string;
  vacancyId: string;
  vacancyTitle: string;
  stage: 'CONTACTED' | 'FINALIST' | 'HIRED' | string;
  feedback: string;
  createdAt: string;
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

export const upsertCandidateFeedback = async (
  vacancyId: string,
  candidateId: string,
  feedback: string,
) => {
  const response = await api.put(
    `/recruiter/vacancies/${vacancyId}/candidates/${candidateId}/feedback`,
    { feedback },
  );
  return response.data;
};

export const getMyRecruiterFeedback = async (): Promise<TalentRecruiterFeedback[]> => {
  try {
    const response = await api.get<TalentRecruiterFeedback[]>('/marketplace/me/feedback');
    return response.data || [];
  } catch (error: unknown) {
    console.warn('Talent feedback endpoint not available', error);
    return [];
  }
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
    area: payload.area,
    description: payload.description,
    requiredSkills: payload.requiredSkills,
    optionalSkills: payload.optionalSkills,
    responsibilities: payload.responsibilities,
    contractType: payload.contractType,
    seniority: payload.seniority,
    salaryMin: payload.salaryMin,
    salaryMax: payload.salaryMax,
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
  const rawVacancy = response.data as unknown as Record<string, unknown>;

  return {
    id: String(rawVacancy.id || rawVacancy._id || ''),
    companyId: String(rawVacancy.companyId || rawVacancy.company_id || ''),
    title: String(rawVacancy.title || ''),
    area: typeof rawVacancy.area === 'string' ? rawVacancy.area : undefined,
    description: String(rawVacancy.description || ''),
    requiredSkills: Array.isArray(rawVacancy.requiredSkills)
      ? rawVacancy.requiredSkills.filter((skill): skill is string => typeof skill === 'string')
      : Array.isArray(rawVacancy.required_skills)
        ? (rawVacancy.required_skills as unknown[]).filter((skill): skill is string => typeof skill === 'string')
        : [],
    optionalSkills: Array.isArray(rawVacancy.optionalSkills)
      ? rawVacancy.optionalSkills.filter((skill): skill is string => typeof skill === 'string')
      : Array.isArray(rawVacancy.optional_skills)
        ? (rawVacancy.optional_skills as unknown[]).filter((skill): skill is string => typeof skill === 'string')
        : [],
    responsibilities: Array.isArray(rawVacancy.responsibilities)
      ? rawVacancy.responsibilities.filter((item): item is string => typeof item === 'string')
      : [],
    contractType:
      typeof rawVacancy.contractType === 'string'
        ? rawVacancy.contractType
        : typeof rawVacancy.contract_type === 'string'
          ? rawVacancy.contract_type
          : undefined,
    seniority:
      typeof rawVacancy.seniority === 'string' ? rawVacancy.seniority : undefined,
    salaryMin:
      typeof rawVacancy.salaryMin === 'number'
        ? rawVacancy.salaryMin
        : typeof rawVacancy.salary_min === 'number'
          ? rawVacancy.salary_min
          : undefined,
    salaryMax:
      typeof rawVacancy.salaryMax === 'number'
        ? rawVacancy.salaryMax
        : typeof rawVacancy.salary_max === 'number'
          ? rawVacancy.salary_max
          : undefined,
    location: typeof rawVacancy.location === 'string' ? rawVacancy.location : undefined,
    modality: typeof rawVacancy.modality === 'string' ? rawVacancy.modality : undefined,
    vacancies: typeof rawVacancy.vacancies === 'number' ? rawVacancy.vacancies : undefined,
    createdAt:
      typeof rawVacancy.createdAt === 'string'
        ? rawVacancy.createdAt
        : typeof rawVacancy.created_at === 'string'
          ? rawVacancy.created_at
          : new Date().toISOString(),
  };
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
    const response = await api.get<
      RecruiterVacancy[] | { data?: RecruiterVacancy[]; items?: RecruiterVacancy[]; vacancies?: RecruiterVacancy[] }
    >('/recruiter/vacancies');

    const payload = response.data;
    const rawVacancies = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.vacancies)
            ? payload.vacancies
            : [];

    return rawVacancies.map((vacancy) => {
      const rawVacancy = vacancy as unknown as Record<string, unknown>;

      return {
        id: String(rawVacancy.id || rawVacancy._id || ''),
        companyId: String(rawVacancy.companyId || rawVacancy.company_id || ''),
        title: String(rawVacancy.title || ''),
        area: typeof rawVacancy.area === 'string' ? rawVacancy.area : undefined,
        description: String(rawVacancy.description || ''),
        requiredSkills: Array.isArray(rawVacancy.requiredSkills)
          ? rawVacancy.requiredSkills.filter((skill): skill is string => typeof skill === 'string')
          : Array.isArray(rawVacancy.required_skills)
            ? (rawVacancy.required_skills as unknown[]).filter((skill): skill is string => typeof skill === 'string')
            : [],
        optionalSkills: Array.isArray(rawVacancy.optionalSkills)
          ? rawVacancy.optionalSkills.filter((skill): skill is string => typeof skill === 'string')
          : Array.isArray(rawVacancy.optional_skills)
            ? (rawVacancy.optional_skills as unknown[]).filter((skill): skill is string => typeof skill === 'string')
            : [],
        responsibilities: Array.isArray(rawVacancy.responsibilities)
          ? rawVacancy.responsibilities.filter((item): item is string => typeof item === 'string')
          : [],
        contractType:
          typeof rawVacancy.contractType === 'string'
            ? rawVacancy.contractType
            : typeof rawVacancy.contract_type === 'string'
              ? rawVacancy.contract_type
              : undefined,
        seniority:
          typeof rawVacancy.seniority === 'string' ? rawVacancy.seniority : undefined,
        salaryMin:
          typeof rawVacancy.salaryMin === 'number'
            ? rawVacancy.salaryMin
            : typeof rawVacancy.salary_min === 'number'
              ? rawVacancy.salary_min
              : undefined,
        salaryMax:
          typeof rawVacancy.salaryMax === 'number'
            ? rawVacancy.salaryMax
            : typeof rawVacancy.salary_max === 'number'
              ? rawVacancy.salary_max
              : undefined,
        location: typeof rawVacancy.location === 'string' ? rawVacancy.location : undefined,
        modality: typeof rawVacancy.modality === 'string' ? rawVacancy.modality : undefined,
        vacancies: typeof rawVacancy.vacancies === 'number' ? rawVacancy.vacancies : undefined,
        createdAt:
          typeof rawVacancy.createdAt === 'string'
            ? rawVacancy.createdAt
            : typeof rawVacancy.created_at === 'string'
              ? rawVacancy.created_at
              : new Date().toISOString(),
      };
    });
  } catch (error: unknown) {
    console.warn('Recruiter vacancies endpoint not available', error);
    return [];
  }
};
