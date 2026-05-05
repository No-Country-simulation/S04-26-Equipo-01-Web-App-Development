import { UserRole } from '../../users/domain/user-role.enum';

export type AuthTokenPayload = {
  userId: string;
  role: UserRole;
};
