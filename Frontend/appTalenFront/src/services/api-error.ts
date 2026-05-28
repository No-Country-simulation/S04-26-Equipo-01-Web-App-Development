import axios from 'axios';

const translateBackendMessage = (message: string): string => {
  const normalizedMessage = message.trim().toLowerCase();

  const exactMessages: Record<string, string> = {
    'invalid credentials': 'Correo o contrasena incorrectos. Verifica tus datos e intenta nuevamente.',
    'a user with this email already exists': 'Ya existe una cuenta registrada con este correo.',
    'email must be an email': 'Ingresa un correo electronico valido.',
    'email must be a string': 'El correo electronico debe ser texto.',
    'password must be a string': 'La contrasena debe ser texto.',
    'password must be longer than or equal to 8 characters':
      'La contrasena debe tener al menos 8 caracteres.',
    'role must be one of: talent, company, admin':
      'Selecciona un tipo de cuenta valido.',
    'level must be one of: initial, medium, advanced':
      'Selecciona un nivel valido.',
    'status must be one of: pending, in_progress, completed':
      'Selecciona un estado valido.',
    'title is required and must be a string':
      'El titulo es obligatorio y debe ser texto.',
    'title must be a string': 'El titulo debe ser texto.',
    'description must be a string': 'La descripcion debe ser texto.',
    'url must be a valid url (e.g., https://meet.google.com/... or https://zoom.us/...)':
      'Ingresa una URL valida.',
    'videourl must be a valid url': 'Ingresa una URL de video valida.',
    'documentationurl must be a valid url':
      'Ingresa una URL de documentacion valida.',
    'platform must be one of: google_meet, zoom, teams, other':
      'Selecciona una plataforma valida.',
    'scheduledat must be a valid iso 8601 datetime':
      'Ingresa una fecha y hora validas.',
    'notes must be a string': 'Las notas deben ser texto.',
  };

  if (exactMessages[normalizedMessage]) {
    return exactMessages[normalizedMessage];
  }

  const minLengthMatch = normalizedMessage.match(
    /^([a-z0-9_.-]+) must be longer than or equal to (\d+) characters$/,
  );
  if (minLengthMatch) {
    const [, field, minLength] = minLengthMatch;
    const fieldName = field === 'password' ? 'La contrasena' : `El campo ${field}`;
    return `${fieldName} debe tener al menos ${minLength} caracteres.`;
  }

  const stringMatch = normalizedMessage.match(/^([a-z0-9_.-]+) must be a string$/);
  if (stringMatch) {
    const [, field] = stringMatch;
    const fieldName = field === 'password' ? 'La contrasena' : `El campo ${field}`;
    return `${fieldName} debe ser texto.`;
  }

  const enumMatch = normalizedMessage.match(/^([a-z0-9_.-]+) must be one of:/);
  if (enumMatch) {
    return `Selecciona un valor valido para ${enumMatch[1]}.`;
  }

  return message;
};

export const getBackendErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return 'Error inesperado en el servidor';
  }

  const backendMessage = error.response?.data?.message;

  if (Array.isArray(backendMessage)) {
    return backendMessage
      .map((message) =>
        typeof message === 'string' ? translateBackendMessage(message) : String(message),
      )
      .join(' | ');
  }

  if (typeof backendMessage === 'string') {
    return translateBackendMessage(backendMessage);
  }

  if (error.response?.status === 401) {
    return 'Correo o contrasena incorrectos. Verifica tus datos e intenta nuevamente.';
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
