import { Request } from 'express';
import { AuthTokenPayload } from '../../domain/auth-token-payload.type';

export type AuthenticatedRequest = Request & {
  user: AuthTokenPayload;
};
