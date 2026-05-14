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
  @IsString()
  title!: string;

  @IsObject()
  answers!: Record<string, unknown>;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  score!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  maxScore?: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
