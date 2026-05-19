import type { AuthUser } from '../types/auth.types';

const ADMIN_CREATED_KEY = 'adminCreated';
const ADMIN_USER_KEY = 'adminUser';
const ADMIN_PASSWORD_KEY = 'adminPassword';
const AUTH_USER_KEY = 'authUser';
const TOKEN_KEY = 'token';

export const ADMIN_EMAIL = 'admin01@admin.com';
export const ADMIN_PASSWORD = 'Admin1234#';

const ADMIN_USER: AuthUser = {
  id: 'admin01',
  name: 'Admin01',
  email: ADMIN_EMAIL,
  role: 'ADMIN',
};

export const ensureAdminSeeded = (): void => {
  if (localStorage.getItem(ADMIN_CREATED_KEY)) {
    return;
  }

  localStorage.setItem(ADMIN_CREATED_KEY, 'true');
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(ADMIN_USER));
  localStorage.setItem(ADMIN_PASSWORD_KEY, ADMIN_PASSWORD);
};

export const getStoredAuthUser = (): AuthUser | null => {
  ensureAdminSeeded();

  const token = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(AUTH_USER_KEY);

  if (!token || !storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
};

export const loginAdmin = (email: string, password: string): AuthUser | null => {
  ensureAdminSeeded();

  const adminUser = localStorage.getItem(ADMIN_USER_KEY);
  const adminPassword = localStorage.getItem(ADMIN_PASSWORD_KEY);

  if (!adminUser || adminPassword !== ADMIN_PASSWORD) {
    return null;
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return null;
  }

  const parsedAdminUser = JSON.parse(adminUser) as AuthUser;
  localStorage.setItem(TOKEN_KEY, 'admin-token');
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(parsedAdminUser));
  return parsedAdminUser;
};