import { AuthenticatedUser } from '../../domain/authenticated-user.type';

export type AuthResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: AuthenticatedUser;
};
