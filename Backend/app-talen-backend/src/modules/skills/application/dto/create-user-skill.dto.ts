import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SkillLevel } from '../../domain/skill-level.enum';

export class CreateUserSkillDto {
  @ApiProperty({
    description: 'Nombre de la habilidad.',
    example: 'TypeScript',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Categoria de la habilidad.',
    example: 'technical',
  })
  @IsString()
  category!: string;

  @ApiProperty({
    description: 'Nivel de dominio de la habilidad.',
    enum: SkillLevel,
    example: SkillLevel.MEDIUM,
  })
  @IsEnum(SkillLevel, {
    message: 'level must be one of: INITIAL, MEDIUM, ADVANCED',
  })
  level!: SkillLevel;

  @ApiPropertyOptional({
    description: 'Evidencia opcional de la habilidad (proyecto, certificacion, etc.).',
    example: 'https://github.com/usuario/proyecto-typescript',
  })
  @IsOptional()
  @IsString()
  evidence?: string;

  @ApiPropertyOptional({
    description: 'Fuente opcional donde se adquirio la habilidad.',
    example: 'curso-online',
  })
  @IsOptional()
  @IsString()
  source?: string;
}
