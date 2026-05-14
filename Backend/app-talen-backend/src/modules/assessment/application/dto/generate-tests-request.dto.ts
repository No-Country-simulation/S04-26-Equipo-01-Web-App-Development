import { IsOptional, IsString } from 'class-validator';

export class GenerateTestsRequestDto {
  @IsOptional()
  @IsString()
  profileId?: string;
}
