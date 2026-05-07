import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../users/domain/user-role.enum';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(UserRole, {
    message: 'role must be one of: TALENT, COMPANY, ADMIN',
  })
  role!: UserRole;
}
