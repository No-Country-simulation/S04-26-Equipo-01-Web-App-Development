import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExternalProfileDto {
  @ApiProperty({
    description: 'Identificador del usuario en el proveedor externo.',
    example: 'google-oauth2|1234567890',
  })
  providerId!: string;

  @ApiProperty({
    description: 'Correo electrónico obtenido del proveedor externo.',
    example: 'talent@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Nombre del usuario proporcionado por el proveedor externo.',
    example: 'Ada',
  })
  firstName!: string;

  @ApiProperty({
    description: 'Apellido del usuario proporcionado por el proveedor externo.',
    example: 'Lovelace',
  })
  lastName!: string;

  @ApiPropertyOptional({
    description: 'Foto de perfil devuelta por el proveedor externo.',
    example: 'https://example.com/avatar.jpg',
  })
  picture?: string;
}
