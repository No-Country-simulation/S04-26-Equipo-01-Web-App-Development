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
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  professionalSummary?: string;
}

class SaveCvDiagnosticSkillsDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  technical!: string[];

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  personal!: string[];
}

class SaveCvDiagnosticExperienceDto {
  @IsString()
  company!: string;

  @IsString()
  position!: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];
}

class SaveCvDiagnosticEducationDto {
  @IsString()
  institution!: string;

  @IsString()
  degree!: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class SaveCvDiagnosticDto {
  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  rawText?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @ValidateNested()
  @Type(() => SaveCvDiagnosticProfileDto)
  profile!: SaveCvDiagnosticProfileDto;

  @ValidateNested()
  @Type(() => SaveCvDiagnosticSkillsDto)
  skills!: SaveCvDiagnosticSkillsDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveCvDiagnosticExperienceDto)
  experience?: SaveCvDiagnosticExperienceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveCvDiagnosticEducationDto)
  education?: SaveCvDiagnosticEducationDto[];

  @IsOptional()
  @IsObject()
  aiAnalysis?: Record<string, unknown>;
}
