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
  try {
    const response = await api.post<Course>('/courses', payload);
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const listCourses = async (options?: ListCourseOptions): Promise<Course[]> => {
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
  try {
    const response = await api.patch<Course>(`/courses/${courseId}`, payload);
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const archiveCourse = async (courseId: string): Promise<void> => {
  try {
    await api.delete(`/courses/${courseId}`);
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const approveCourse = async (courseId: string): Promise<Course> => {
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
  try {
    await api.delete(`/courses/${courseId}/meeting-links/${meetingLinkId}`);
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};
