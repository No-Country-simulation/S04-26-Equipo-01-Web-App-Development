import { UserRole } from '../../users/domain/user-role.enum';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  linkedinConnected: boolean;
};
