export const UserRole = {
  TALENT: 'TALENT',
  COMPANY: 'COMPANY',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  [key: string]: unknown;
}

export interface RegisterDto {
  email: string;
  password: string;
  role: UserRole; 
}

export type LoginDto = {
  email: string;
  password: string;
};

export type LoginResponse ={
  accessToken: string;
  user:{
    id: string;
    email: string;
    name?: string;
    role: UserRole;
  }
};

