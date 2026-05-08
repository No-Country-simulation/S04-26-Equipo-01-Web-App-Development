import type { FC } from 'react';
import type { AuthUser } from '../../App';

export declare const AuthPage: FC<{
  onLoginSuccess: (user: AuthUser) => void;
  tab?: number;
}>;
