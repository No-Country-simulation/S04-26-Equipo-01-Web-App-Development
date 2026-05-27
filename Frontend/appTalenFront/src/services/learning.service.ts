import api from '../features/api/axiosInterface';
import { throwBackendError } from './api-error';
import type {
  GenerateLearningPathDto,
  LearningModule,
  LearningPath,
  UpdateModuleProgressDto,
  UserModuleProgress,
} from '../types/learning.types';

type RecruiterLearningPathFallback = {
  id?: string;
  status?: string;
  progress?: number;
};

type RecruiterCourseFallback = {
  id: string;
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | string;
  progress?: number;
};

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

const mapCourseStatusToModuleStatus = (
  status?: string,
): UserModuleProgress['status'] => {
  if (status === 'completed') return 'COMPLETED';
  if (status === 'in_progress') return 'IN_PROGRESS';
  return 'PENDING';
};

const buildFallbackLearningPaths = (
  profileId: string,
  learningPath: RecruiterLearningPathFallback | null,
  courses: RecruiterCourseFallback[],
): LearningPath[] => {
  if (!learningPath && courses.length === 0) {
    return [];
  }

  const pathId = learningPath?.id ?? `fallback-learning-path-${profileId}`;

  const modules: LearningModule[] = courses.map((course, index) => ({
    id: course.id,
    learningPathId: pathId,
    title: course.title,
    description: course.description,
    category: 'digital',
    order: index + 1,
    progress: [
      {
        id: `progress-${course.id}`,
        profileId,
        moduleId: course.id,
        status: mapCourseStatusToModuleStatus(course.status),
        progress: course.progress ?? 0,
      },
    ],
  }));

  return [
    {
      id: pathId,
      profileId,
      title: 'Ruta de cursos',
      objective: 'Ruta obtenida desde endpoints de recruiter.',
      aiGenerated: true,
      recommendedTrack: learningPath?.status,
      confidence: learningPath?.progress,
      createdAt: new Date().toISOString(),
      modules,
    },
  ];
};

const getMyLearningPathsFromRecruiterFallback = async (): Promise<LearningPath[]> => {
  const profileId = getStoredAuthUserId();
  if (!profileId) {
    return [];
  }

  const [learningPathResponse, coursesResponse] = await Promise.all([
    api
      .get<RecruiterLearningPathFallback | null>(
        `/recruiter/candidates/${profileId}/learning-path`,
      )
      .catch(() => ({ data: null })),
    api
      .get<RecruiterCourseFallback[]>(`/recruiter/candidates/${profileId}/courses`)
      .catch(() => ({ data: [] as RecruiterCourseFallback[] })),
  ]);

  const learningPath = learningPathResponse.data ?? null;
  const courses = Array.isArray(coursesResponse.data) ? coursesResponse.data : [];
  return buildFallbackLearningPaths(profileId, learningPath, courses);
};

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
    const fallbackPaths = await getMyLearningPathsFromRecruiterFallback().catch(() => []);
    if (fallbackPaths.length > 0) {
      return fallbackPaths[0];
    }

    return throwBackendError(error);
  }
};

export const getMyLearningPaths = async (): Promise<LearningPath[]> => {
  try {
    const response = await api.get<LearningPath[]>('/learning-paths/me');
    return response.data;
  } catch{
    const fallbackPaths = await getMyLearningPathsFromRecruiterFallback().catch(() => []);
    return fallbackPaths;
  }
};

export const getMyLearningModules = async (): Promise<LearningModule[]> => {
  try {
    const response = await api.get<LearningModule[]>('/learning-modules/me');
    return response.data;
  } catch{
    const paths = await getMyLearningPathsFromRecruiterFallback().catch(() => []);
    return paths.flatMap((path) => path.modules ?? []);
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
