import { IsInt, IsOptional, IsString, Min, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCourseModuleDto {
  @ApiPropertyOptional({ description: 'Module title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Module description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Order of the module within the course',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    description: 'Video URL for the module (external host)',
  })
  @IsOptional()
  @IsUrl({}, { message: 'videoUrl must be a valid URL' })
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Documentation URL for the module (external host)',
  })
  @IsOptional()
  @IsUrl({}, { message: 'documentationUrl must be a valid URL' })
  documentationUrl?: string;

  @ApiPropertyOptional({ description: 'Estimated duration in minutes' })
  @IsOptional()
  @IsInt()
  durationMin?: number;
}
