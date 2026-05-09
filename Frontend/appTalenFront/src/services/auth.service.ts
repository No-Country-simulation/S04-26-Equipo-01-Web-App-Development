import api from '../feactures/api/axiosInterface';
import type { RegisterDto, LoginDto, LoginResponse } from '../types/auth.types';
import axios from 'axios';

const getBackendErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return 'Error inesperado en el servidor';
  }

  const backendMessage = error.response?.data?.message;
  if (Array.isArray(backendMessage)) {
    return backendMessage.join(' | ');
  }
  if (typeof backendMessage === 'string') {
    return backendMessage;
  }

  if (error.response?.status === 401) {
    return 'Credenciales inválidas. Verifica tu correo y contraseña.';
  }

  return 'Error inesperado en el servidor';
};

export const registerUser = async (data: RegisterDto) => {
  try {
    const response = await api.post('/auth/register', data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getBackendErrorMessage(error));
  }
};

export async function loginUser(data: LoginDto): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getBackendErrorMessage(error));
  }
}



