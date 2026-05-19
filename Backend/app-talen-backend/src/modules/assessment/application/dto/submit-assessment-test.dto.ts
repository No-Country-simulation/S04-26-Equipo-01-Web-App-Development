import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class SubmitAssessmentTestDto {
  @ApiProperty({
    description: 'Mapa de respuestas del usuario por identificador de pregunta.',
    example: {
      tech_api_1: 'b',
      tech_validation_1: 'b',
    },
  })
  @IsObject()
  answers!: Record<string, string>;
}
