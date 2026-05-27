import { ApiProperty } from '@nestjs/swagger';
import { AuthenticatedUser } from '../../domain/authenticated-user.type';

export class AuthResponse {
  @ApiProperty({
    description: 'Token JWT emitido por el backend.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJyb2xlIjoiVEFMRU5UIiwiaWF0IjoxNzE2MDAwMDAwLCJleHAiOjE3MTY1OTQ4MDB9.example-signature',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'Tipo de token utilizado en el encabezado Authorization.',
    example: 'Bearer',
  })
  tokenType!: 'Bearer';

  @ApiProperty({
    description: 'Tiempo de expiración configurado para el token.',
    example: '7d',
  })
  expiresIn!: string;

  @ApiProperty({
    description: 'Usuario autenticado asociado al token.',
    type: () => AuthenticatedUser,
  })
  user!: AuthenticatedUser;
}
