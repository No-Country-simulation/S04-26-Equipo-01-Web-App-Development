import type * as React from 'react';
import type { AuthUser } from '../../App';

export interface AuthPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  tab?: number;
}

export declare const AuthPage: React.FC<AuthPageProps>;
