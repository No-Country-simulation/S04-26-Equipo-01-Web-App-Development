import { IsString, IsOptional, IsInt, Min, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseModuleDto {
  @ApiProperty({ description: 'Module title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Module description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Order of the module within the course',
    example: 1,
  })
  @IsInt()
  @Min(1)
  order!: number;

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
