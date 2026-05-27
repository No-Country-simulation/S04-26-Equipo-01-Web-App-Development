import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/domain/user-role.enum';

export class AuthenticatedUser {
  @ApiProperty({
    description: 'Identificador único del usuario.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario autenticado.',
    example: 'talent@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Rol asignado al usuario autenticado.',
    enum: UserRole,
    example: UserRole.TALENT,
  })
  role!: UserRole;
}
