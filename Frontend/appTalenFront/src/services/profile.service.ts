import api from '../feactures/api/axiosInterface';
import { throwBackendError } from './api-error';
import type {
  AnalyzeCvFileDto,
  AnalyzeCvTextDto,
  CreateProfileDto,
  CvAnalysisResponse,
  Profile,
  UpdateInterestedRolesDto,
  UpdateProfileDto,
  UpdateWorkPreferencesDto,
} from '../types/profile.types';

export const createMyProfile = async (
  data: CreateProfileDto,
): Promise<Profile> => {
  try {
    const response = await api.post<Profile>('/profiles/me', data);
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const getMyProfile = async (): Promise<Profile> => {
  try {
    const response = await api.get<Profile>('/profiles/me');
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const updateMyProfile = async (
  data: UpdateProfileDto,
): Promise<Profile> => {
  try {
    const response = await api.patch<Profile>('/profiles/me', data);
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const updateMyWorkPreferences = async (
  data: UpdateWorkPreferencesDto,
): Promise<Profile> => {
  try {
    const response = await api.patch<Profile>('/profiles/me/preferences', data);
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const updateMyInterestedRoles = async (
  data: UpdateInterestedRolesDto,
): Promise<Profile> => {
  try {
    const response = await api.patch<Profile>(
      '/profiles/me/interested-roles',
      data,
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const recalculateMyEmployabilityScore = async (): Promise<Profile> => {
  try {
    const response = await api.patch<Profile>(
      '/profiles/me/employability-score',
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const analyzeMyCvFromText = async (
  data: AnalyzeCvTextDto,
): Promise<CvAnalysisResponse> => {
  try {
    const response = await api.post<CvAnalysisResponse>(
      '/profiles/me/cv/analyze',
      data,
    );
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export const analyzeMyCvFromFile = async ({
  file,
  applyToProfile,
  extractedText,
}: AnalyzeCvFileDto): Promise<CvAnalysisResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    if (applyToProfile !== undefined) {
      formData.append('applyToProfile', String(applyToProfile));
    }

    if (extractedText) {
      formData.append('extractedText', extractedText);
    }

    const response = await api.post<CvAnalysisResponse>(
      '/profiles/me/cv/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};
