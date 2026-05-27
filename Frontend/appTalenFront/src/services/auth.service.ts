import api from '../features/api/axiosInterface';
import type {
  RegisterDto,
  LoginDto,
  LoginResponse,
  AuthConnections,
} from '../types/auth.types';
import { throwBackendError } from './api-error';

export const registerUser = async (data: RegisterDto) => {
  try {
    const response = await api.post('/auth/register', data);
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
};

export async function loginUser(data: LoginDto): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
}

export async function getMyAuthConnections(): Promise<AuthConnections> {
  try {
    const response = await api.get<AuthConnections>('/auth/me/connections');
    return response.data;
  } catch (error: unknown) {
    return throwBackendError(error);
  }
}


