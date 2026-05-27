import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ImportLinkedInCvDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200000)
  extractedText?: string;
}
