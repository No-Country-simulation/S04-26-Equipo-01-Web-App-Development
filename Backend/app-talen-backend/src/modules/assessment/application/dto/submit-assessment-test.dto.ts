import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class SubmitAssessmentTestDto {
  @ApiProperty({
    description:
      'Mapa de respuestas del test, donde la clave es el identificador de la pregunta.',
    example: {
      psy_logic_1: 'b',
      psy_attention_1: 'a',
    },
  })
  @IsObject()
  answers!: Record<string, string>;
}
