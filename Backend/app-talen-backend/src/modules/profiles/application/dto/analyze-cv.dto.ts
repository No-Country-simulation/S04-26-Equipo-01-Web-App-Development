import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AnalyzeCvDto {
  @IsOptional()
  @IsString()
  extractedText?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  applyToProfile?: boolean;
}
