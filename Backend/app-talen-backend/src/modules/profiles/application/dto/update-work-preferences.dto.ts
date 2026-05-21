import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WorkModality } from '../../domain/work-modality.enum';

export class UpdateWorkPreferencesDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsEnum(WorkModality, {
    message: 'preferredModality must be one of: VIRTUAL, HIBRIDO, PRESENCIAL',
  })
  preferredModality?: WorkModality;
}
