import { IsOptional, IsString } from 'class-validator';

export class GenerateLearningPathDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  objective?: string;
}
