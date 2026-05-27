import api from '../features/api/axiosInterface';
import { throwBackendError } from './api-error';
import type {
  AddMeetingLinkDto,
  Course,
  CourseModule,
  CreateCourseDto,
  CreateCourseModuleDto,
  MeetingLink,
  UpdateCourseDto,
  UpdateCourseModuleDto,
} from '../types/course.types';
import { CourseStatus } from '../types/course.types';

const SEEDED_ADMIN_EMAIL = 'admin01@admin.com';
const SEEDED_ADMIN_TOKEN = 'admin-token';
const SEEDED_ADMIN_COURSES_KEY = 'seed-admin-courses';

const nowIso = (): string => new Date().toISOString();

const buildLocalId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const isSeedAdminSession = (): boolean => {
  const token = localStorage.getItem('token');
  if (token !== SEEDED_ADMIN_TOKEN) {
    return false;
  }

  const rawAuthUser = localStorage.getItem('authUser');
  if (!rawAuthUser) {
    return false;
  }

  try {
    const parsedUser = JSON.parse(rawAuthUser) as { role?: string; email?: string };
    return parsedUser.role === 'ADMIN' && parsedUser.email === SEEDED_ADMIN_EMAIL;
  } catch {
    return false;
  }
};

const readSeedAdminCourses = (): Course[] => {
  const raw = localStorage.getItem(SEEDED_ADMIN_COURSES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Course[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSeedAdminCourses = (courses: Course[]): void => {
  localStorage.setItem(SEEDED_ADMIN_COURSES_KEY, JSON.stringify(courses));
};

const withSeedAdminCourses = <T>(updater: (courses: Course[]) => T): T => {
  const courses = readSeedAdminCourses();
  const result = updater(courses);
  writeSeedAdminCourses(courses);
  return result;
};

type ListCourseOptions = {
  published?: boolean;
};

const toPublishedQuery = (options?: ListCourseOptions): string => {
  if (typeof options?.published !== 'boolean') {
    return '';
  }

  return `?published=${options.published ? 'true' : 'false'}`;
};

export const createCourse = async (payload: CreateCourseDto): Promise<Course> => {
  if (isSeedAdminSession()) {
    return withSeedAdminCourses((courses) => {
      const createdAt = nowIso();
      const newCourse: Course = {
        id: buildLocalId('course'),
        title: payload.title,
        description: payload.description,
        status: payload.status ?? CourseStatus.DRAFT,
        createdBy: SEEDED_ADMIN_EMAIL,
        createdAt,
        updatedAt: createdAt,
        modules: [],
        meetingLinks: [],
      };

      courses.unshift(newCourse);
      return newCourse;
    });
  }

  try {
    const response = await api.post<Course>('/courses', payload);
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const listCourses = async (options?: ListCourseOptions): Promise<Course[]> => {
  if (isSeedAdminSession()) {
    const courses = readSeedAdminCourses();

    if (options?.published === true) {
      return courses.filter((course) => course.status === CourseStatus.PUBLISHED);
    }

    return courses;
  }

  try {
    const response = await api.get<Course[]>(`/courses${toPublishedQuery(options)}`);
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const listMyCompanyCourses = async (
  options?: ListCourseOptions,
): Promise<Course[]> => {
  try {
    const response = await api.get<Course[]>(
      `/courses/company/me${toPublishedQuery(options)}`,
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const getCourseById = async (courseId: string): Promise<Course> => {
  try {
    const response = await api.get<Course>(`/courses/${courseId}`);
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const updateCourse = async (
  courseId: string,
  payload: UpdateCourseDto,
): Promise<Course> => {
  if (isSeedAdminSession()) {
    return withSeedAdminCourses((courses) => {
      const course = courses.find((item) => item.id === courseId);
      if (!course) {
        throw new Error('Curso no encontrado.');
      }

      if (payload.title !== undefined) {
        course.title = payload.title;
      }

      if (payload.description !== undefined) {
        course.description = payload.description;
      }

      if (payload.status !== undefined) {
        course.status = payload.status;
      }

      course.updatedAt = nowIso();
      return course;
    });
  }

  try {
    const response = await api.patch<Course>(`/courses/${courseId}`, payload);
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const archiveCourse = async (courseId: string): Promise<void> => {
  if (isSeedAdminSession()) {
    withSeedAdminCourses((courses) => {
      const course = courses.find((item) => item.id === courseId);
      if (!course) {
        throw new Error('Curso no encontrado.');
      }

      course.status = CourseStatus.ARCHIVED;
      course.updatedAt = nowIso();
    });

    return;
  }

  try {
    await api.delete(`/courses/${courseId}`);
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const approveCourse = async (courseId: string): Promise<Course> => {
  if (isSeedAdminSession()) {
    return updateCourse(courseId, { status: CourseStatus.PUBLISHED });
  }

  try {
    const response = await api.post<Course>(`/courses/${courseId}/approve`);
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const addCourseModule = async (
  courseId: string,
  payload: CreateCourseModuleDto,
): Promise<CourseModule> => {
  if (isSeedAdminSession()) {
    return withSeedAdminCourses((courses) => {
      const course = courses.find((item) => item.id === courseId);
      if (!course) {
        throw new Error('Curso no encontrado.');
      }

      const createdAt = nowIso();
      const module: CourseModule = {
        id: buildLocalId('module'),
        courseId,
        title: payload.title,
        description: payload.description,
        order: payload.order,
        videoUrl: payload.videoUrl,
        documentationUrl: payload.documentationUrl,
        durationMin: payload.durationMin,
        createdAt,
        updatedAt: createdAt,
      };

      course.modules = [...course.modules, module].sort((a, b) => a.order - b.order);
      course.updatedAt = nowIso();
      return module;
    });
  }

  try {
    const response = await api.post<CourseModule>(
      `/courses/${courseId}/modules`,
      payload,
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const updateCourseModule = async (
  courseId: string,
  moduleId: string,
  payload: UpdateCourseModuleDto,
): Promise<CourseModule> => {
  try {
    const response = await api.patch<CourseModule>(
      `/courses/${courseId}/modules/${moduleId}`,
      payload,
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const deleteCourseModule = async (
  courseId: string,
  moduleId: string,
): Promise<void> => {
  if (isSeedAdminSession()) {
    withSeedAdminCourses((courses) => {
      const course = courses.find((item) => item.id === courseId);
      if (!course) {
        throw new Error('Curso no encontrado.');
      }

      course.modules = course.modules.filter((module) => module.id !== moduleId);
      course.updatedAt = nowIso();
    });

    return;
  }

  try {
    await api.delete(`/courses/${courseId}/modules/${moduleId}`);
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const addCourseMeetingLink = async (
  courseId: string,
  payload: AddMeetingLinkDto,
): Promise<MeetingLink> => {
  if (isSeedAdminSession()) {
    return withSeedAdminCourses((courses) => {
      const course = courses.find((item) => item.id === courseId);
      if (!course) {
        throw new Error('Curso no encontrado.');
      }

      const createdAt = nowIso();
      const meetingLink: MeetingLink = {
        id: buildLocalId('meeting'),
        courseId,
        url: payload.url,
        platform: payload.platform,
        scheduledAt: payload.scheduledAt,
        password: payload.password,
        notes: payload.notes,
        addedBy: SEEDED_ADMIN_EMAIL,
        createdAt,
        updatedAt: createdAt,
      };

      course.meetingLinks = [...course.meetingLinks, meetingLink];
      course.updatedAt = nowIso();
      return meetingLink;
    });
  }

  try {
    const response = await api.post<MeetingLink>(
      `/courses/${courseId}/meeting-links`,
      payload,
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const deleteCourseMeetingLink = async (
  courseId: string,
  meetingLinkId: string,
): Promise<void> => {
  if (isSeedAdminSession()) {
    withSeedAdminCourses((courses) => {
      const course = courses.find((item) => item.id === courseId);
      if (!course) {
        throw new Error('Curso no encontrado.');
      }

      course.meetingLinks = course.meetingLinks.filter((meeting) => meeting.id !== meetingLinkId);
      course.updatedAt = nowIso();
    });

    return;
  }

  try {
    await api.delete(`/courses/${courseId}/meeting-links/${meetingLinkId}`);
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};
