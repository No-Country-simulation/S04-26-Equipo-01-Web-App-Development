import axios from 'axios';

export const getBackendErrorMessage = (error: unknown): string => {
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
    return 'No autorizado. Inicia sesion nuevamente.';
  }

  if (error.response?.status === 403) {
    return 'No tenes permisos para realizar esta accion.';
  }

  if (error.response?.status === 404) {
    return 'Recurso no encontrado.';
  }

  if (error.response?.status === 409) {
    return 'El recurso ya existe.';
  }

  return 'Error inesperado en el servidor';
};

export const throwBackendError = (error: unknown): never => {
  throw new Error(getBackendErrorMessage(error));
};
