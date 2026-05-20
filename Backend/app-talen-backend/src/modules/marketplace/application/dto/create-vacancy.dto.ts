import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsInt,
  IsArray,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateVacancyDto {
  @ApiProperty({
    description: 'Titulo de la vacante',
    example: 'Frontend Developer React',
  })
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiProperty({
    description: 'Descripcion de la vacante',
    example:
      'Buscamos desarrollador con experiencia en React, TypeScript y consumo de APIs REST.',
  })
  @IsString()
  @MaxLength(3000)
  description!: string;

  @ApiPropertyOptional({
    description: 'Skills requeridas para la vacante',
    type: [String],
    example: ['React', 'TypeScript', 'Tailwind'],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional({
    description: 'Ubicacion de la vacante',
    example: 'Lima, Peru',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @ApiPropertyOptional({
    description: 'Modalidad de trabajo',
    example: 'Remoto',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  modality?: string;

  @ApiPropertyOptional({
    description: 'Cantidad de vacantes disponibles para este proceso',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  vacancies?: number;
}
