import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CourseStatus } from '../../domain/course-status.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCourseDto {
  @ApiPropertyOptional({ description: 'Course title' })
  @IsOptional()
  @IsString({ message: 'title must be a string' })
  title?: string;

  @ApiPropertyOptional({ description: 'Course description' })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @ApiPropertyOptional({ description: 'Course status', enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus, {
    message:
      'status must be one of: DRAFT, PENDING_REVIEW, PUBLISHED, ARCHIVED. COMPANY users may only set DRAFT or PENDING_REVIEW; ADMIN can publish.',
  })
  status?: CourseStatus;
}
