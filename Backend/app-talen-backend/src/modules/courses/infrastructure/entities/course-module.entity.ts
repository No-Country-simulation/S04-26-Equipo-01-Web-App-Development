import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('course_modules')
export class CourseModule {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Course module unique identifier',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({ description: 'Parent course id', format: 'uuid' })
  @Column()
  courseId!: string;

  @ApiProperty({ description: 'Module title' })
  @Column()
  title!: string;

  @ApiPropertyOptional({ description: 'Module description' })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Order of the module within the course',
    example: 1,
  })
  @Column({ type: 'int' })
  order!: number;

  @ApiPropertyOptional({ description: 'Video URL for the module' })
  @Column({ nullable: true })
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Documentation URL for the module' })
  @Column({ nullable: true })
  documentationUrl?: string;

  @ApiPropertyOptional({ description: 'Estimated duration in minutes' })
  @Column({ type: 'int', nullable: true })
  durationMin?: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Course, (course) => course.modules, {
    onDelete: 'CASCADE',
  })
  course!: Course;
}
