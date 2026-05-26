import type * as React from 'react';
import type { AuthUser } from '../../types/auth.types';


export interface AuthPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  tab?: number;
  handleAdminLogin?: (email: string, password: string) => boolean;
}

export declare const AuthPage: React.FC<AuthPageProps>;
