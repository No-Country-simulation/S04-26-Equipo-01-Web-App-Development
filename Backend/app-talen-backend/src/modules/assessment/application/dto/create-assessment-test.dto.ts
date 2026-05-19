import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateAssessmentTestDto {
  @ApiProperty({
    description: 'Titulo del resultado del test.',
    example: 'Prueba tecnica de TypeORM',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Respuestas enviadas para calcular o almacenar el resultado.',
    example: {
      tech_db_1: 'a',
      tech_validation_1: 'b',
    },
  })
  @IsObject()
  answers!: Record<string, unknown>;

  @ApiProperty({
    description: 'Puntaje obtenido en el test.',
    example: 80,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  score!: number;

  @ApiPropertyOptional({
    description: 'Puntaje maximo posible del test.',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  maxScore?: number;

  @ApiPropertyOptional({
    description: 'Comentario adicional sobre el resultado.',
    example: 'Buen dominio de conceptos base, reforzar validacion de datos.',
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}
