export const UserRole = {
  TALENT: 'TALENT',
  COMPANY: 'COMPANY',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

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

