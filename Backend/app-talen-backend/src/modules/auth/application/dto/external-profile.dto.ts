import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExternalProfileDto {
  @ApiProperty({
    description: 'Identificador del proveedor externo.',
    example: 'google-oauth2|1234567890',
  })
  providerId!: string;

  @ApiProperty({
    description: 'Correo electrónico del perfil externo.',
    example: 'talent@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Nombre del usuario.',
    example: 'Ada',
  })
  firstName!: string;

  @ApiProperty({
    description: 'Apellido del usuario.',
    example: 'Lovelace',
  })
  lastName!: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen del perfil externo.',
    example: 'https://example.com/avatar.png',
  })
  picture?: string;

  @ApiPropertyOptional({
    description: 'Rol inferido o asignado al usuario externo.',
    example: 'TALENT',
  })
  role?: string;
}
