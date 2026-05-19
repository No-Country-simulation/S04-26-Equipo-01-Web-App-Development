import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario.',
    example: 'talent@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Contraseña del usuario. Debe tener al menos 8 caracteres.',
    example: 'StrongPass123',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
