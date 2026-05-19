import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CourseStatus } from '../../domain/course-status.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ description: 'Course title' })
  @IsString({ message: 'title is required and must be a string' })
  title!: string;

  @ApiPropertyOptional({ description: 'Course description' })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @ApiPropertyOptional({
    description:
      'Course status. COMPANY can only request publication via PENDING_REVIEW; ADMIN can set PUBLISHED.',
    enum: CourseStatus,
  })
  @IsOptional()
  @IsEnum(CourseStatus, {
    message:
      'status must be one of: DRAFT, PENDING_REVIEW, PUBLISHED, ARCHIVED. If you are a COMPANY and want to publish, set status to PENDING_REVIEW to request admin approval.',
  })
  status?: CourseStatus;
}
