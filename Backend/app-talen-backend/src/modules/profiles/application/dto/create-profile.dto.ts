import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateProfileDto {
  @ApiProperty({
    description: 'Nombre completo del usuario.',
    example: 'Ada Lovelace',
  })
  @IsString()
  fullName!: string;

  @ApiPropertyOptional({
    description: 'Rango etario del usuario.',
    example: '25-34',
  })
  @IsOptional()
  @IsString()
  ageRange?: string;

  @ApiPropertyOptional({
    description: 'Ubicación principal del usuario.',
    example: 'Buenos Aires, Argentina',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Estado laboral actual.',
    example: 'Looking for opportunities',
  })
  @IsOptional()
  @IsString()
  currentStatus?: string;

  @ApiPropertyOptional({
    description: 'Título breve o headline profesional.',
    example: 'Frontend developer focused on React and TypeScript',
  })
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional({
    description: 'Resumen profesional del usuario.',
    example:
      'Frontend developer with experience building accessible and scalable web applications.',
  })
  @IsOptional()
  @IsString()
  professionalBio?: string;

  @ApiPropertyOptional({
    description: 'Años de experiencia profesional.',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(80)
  yearsExperience?: number;
}
