import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../users/domain/user-role.enum';

export class RegisterDto {
  @ApiProperty({
    description: 'Correo electrónico del nuevo usuario.',
    example: 'talent@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description:
      'Contraseña inicial del usuario. Debe tener al menos 8 caracteres.',
    example: 'StrongPass123',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'Rol con el que se registra el usuario.',
    enum: UserRole,
    example: UserRole.TALENT,
  })
  @IsEnum(UserRole, {
    message: 'role must be one of: TALENT, COMPANY, ADMIN',
  })
  role!: UserRole;
}
