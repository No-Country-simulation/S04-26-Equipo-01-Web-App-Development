import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WorkModality } from '../../domain/work-modality.enum';

export class UpdateWorkPreferencesDto {
  @ApiPropertyOptional({
    description: 'País de preferencia laboral.',
    example: 'Argentina',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Modalidad de trabajo preferida.',
    enum: WorkModality,
    example: WorkModality.HIBRIDO,
  })
  @IsOptional()
  @IsEnum(WorkModality, {
    message: 'preferredModality must be one of: VIRTUAL, HIBRIDO, PRESENCIAL',
  })
  preferredModality?: WorkModality;
}
