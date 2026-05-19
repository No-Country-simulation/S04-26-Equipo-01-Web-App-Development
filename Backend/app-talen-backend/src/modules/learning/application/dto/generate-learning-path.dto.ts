import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateLearningPathDto {
  @ApiPropertyOptional({
    description:
      'Titulo personalizado para la ruta de aprendizaje. Si no se envia, se genera automaticamente.',
    example: 'Ruta Backend Nivelacion Node.js',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description:
      'Objetivo principal de la ruta de aprendizaje. Si no se envia, se toma del assessment o un valor por defecto.',
    example: 'Mejorar empleabilidad como desarrollador backend junior',
  })
  @IsOptional()
  @IsString()
  objective?: string;
}
