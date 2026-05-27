import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpsertCandidateFeedbackDto {
  @ApiProperty({
    description: 'Feedback textual del reclutador para el candidato.',
    example:
      'Buen ajuste cultural y tecnico. Recomendado reforzar pruebas de arquitectura para la etapa final.',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  feedback!: string;
}
