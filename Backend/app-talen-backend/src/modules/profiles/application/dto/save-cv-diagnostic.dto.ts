import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class SaveCvDiagnosticProfileDto {
  @ApiPropertyOptional({
    description: 'Nombre completo detectado en el CV.',
    example: 'Ada Lovelace',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico detectado en el CV.',
    example: 'talent@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Teléfono detectado en el CV.',
    example: '+54 11 5555-5555',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Ubicación detectada en el CV.',
    example: 'Buenos Aires, Argentina',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Título profesional detectado en el CV.',
    example: 'Frontend Developer',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Resumen profesional detectado en el CV.',
    example: 'Frontend developer focused on accessibility.',
  })
  @IsOptional()
  @IsString()
  professionalSummary?: string;
}

class SaveCvDiagnosticSkillsDto {
  @ApiProperty({
    description: 'Lista de habilidades técnicas detectadas en el CV.',
    example: ['TypeScript', 'React', 'NestJS'],
    isArray: true,
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  technical!: string[];

  @ApiProperty({
    description: 'Lista de habilidades personales detectadas en el CV.',
    example: ['Teamwork', 'Communication'],
    isArray: true,
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  personal!: string[];
}

class SaveCvDiagnosticExperienceDto {
  @ApiProperty({
    description: 'Nombre de la empresa.',
    example: 'Acme Corp',
  })
  @IsString()
  company!: string;

  @ApiProperty({
    description: 'Cargo o posición desempeñada.',
    example: 'Frontend Developer',
  })
  @IsString()
  position!: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio de la experiencia.',
    example: '2021-03',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de finalización de la experiencia.',
    example: '2024-02',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Descripción de responsabilidades o logros.',
    example: 'Built the main design system for the product team.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Puntos destacados de la experiencia.',
    example: ['Improved performance by 30%', 'Led migrations to TypeScript'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];
}

class SaveCvDiagnosticEducationDto {
  @ApiProperty({
    description: 'Institución educativa.',
    example: 'Universidad de Buenos Aires',
  })
  @IsString()
  institution!: string;

  @ApiProperty({
    description: 'Título o grado obtenido.',
    example: 'Computer Science',
  })
  @IsString()
  degree!: string;

  @ApiPropertyOptional({
    description: 'Detalles adicionales sobre la formación.',
    example: 'Thesis focused on human-computer interaction.',
  })
  @IsOptional()
  @IsString()
  details?: string;

  @ApiPropertyOptional({
    description: 'Estado académico de la formación.',
    example: 'Completed',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class SaveCvDiagnosticDto {
  @ApiPropertyOptional({
    description: 'Nombre del archivo procesado.',
    example: 'ada-lovelace-cv.pdf',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'Texto completo extraído del CV.',
    example: 'Ada Lovelace is a frontend developer...',
  })
  @IsOptional()
  @IsString()
  rawText?: string;

  @ApiPropertyOptional({
    description: 'Resumen general del CV extraído o generado.',
    example: 'Frontend profile with strong React and accessibility background.',
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({
    description: 'Sección de perfil reconstruida desde el CV.',
    type: () => SaveCvDiagnosticProfileDto,
    example: {
      fullName: 'Ada Lovelace',
      email: 'talent@example.com',
      phone: '+54 11 5555-5555',
      location: 'Buenos Aires, Argentina',
      title: 'Frontend Developer',
      professionalSummary: 'Frontend developer focused on accessibility.',
    },
  })
  @ValidateNested()
  @Type(() => SaveCvDiagnosticProfileDto)
  profile!: SaveCvDiagnosticProfileDto;

  @ApiProperty({
    description: 'Sección de habilidades reconstruida desde el CV.',
    type: () => SaveCvDiagnosticSkillsDto,
    example: {
      technical: ['TypeScript', 'React', 'NestJS'],
      personal: ['Communication', 'Teamwork'],
    },
  })
  @ValidateNested()
  @Type(() => SaveCvDiagnosticSkillsDto)
  skills!: SaveCvDiagnosticSkillsDto;

  @ApiPropertyOptional({
    description: 'Experiencias laborales detectadas.',
    type: () => SaveCvDiagnosticExperienceDto,
    isArray: true,
    example: [
      {
        company: 'Acme Corp',
        position: 'Frontend Developer',
        startDate: '2021-03',
        endDate: '2024-02',
        description: 'Built the main design system.',
        highlights: ['Improved performance by 30%'],
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveCvDiagnosticExperienceDto)
  experience?: SaveCvDiagnosticExperienceDto[];

  @ApiPropertyOptional({
    description: 'Formación académica detectada.',
    type: () => SaveCvDiagnosticEducationDto,
    isArray: true,
    example: [
      {
        institution: 'Universidad de Buenos Aires',
        degree: 'Computer Science',
        details: 'Thesis focused on HCI.',
        status: 'Completed',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveCvDiagnosticEducationDto)
  education?: SaveCvDiagnosticEducationDto[];

  @ApiPropertyOptional({
    description: 'Objeto libre con la salida original de la IA.',
    example: {
      summary:
        'Frontend profile with strong React and accessibility background.',
      suggestedSkills: [
        { name: 'React', category: 'technical', level: 'ADVANCED' },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  aiAnalysis?: Record<string, unknown>;
}
