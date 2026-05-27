import api from '../features/api/axiosInterface';
import { throwBackendError } from './api-error';
import type {
  CreateUserSkillDto,
  UpdateUserSkillDto,
  UserSkill,
} from '../types/skill.types';

export const getMySkills = async (): Promise<UserSkill[]> => {
  try {
    const response = await api.get<UserSkill[]>('/skills/me');
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const createMySkill = async (
  data: CreateUserSkillDto,
): Promise<UserSkill> => {
  try {
    const response = await api.post<UserSkill>('/skills/me', data);
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const updateMySkill = async (
  skillId: string,
  data: UpdateUserSkillDto,
): Promise<UserSkill> => {
  try {
    const response = await api.patch<UserSkill>(`/skills/me/${skillId}`, data);
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};
