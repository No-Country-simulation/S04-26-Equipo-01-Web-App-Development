import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '../../domain/course-status.enum';
import { CourseModule } from './course-module.entity';
import { MeetingLink } from './meeting-link.entity';
import { Company } from '../../../companies/infrastructure/entities/company.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Course unique identifier', format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Course title' })
  @Column()
  title!: string;

  @ApiPropertyOptional({ description: 'Course description' })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({ description: 'Course status', enum: CourseStatus })
  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.DRAFT,
  })
  status!: CourseStatus;

  @ApiProperty({ description: 'User ID of the creator' })
  @Column()
  createdBy!: string;

  @ApiPropertyOptional({ description: 'Company ID if created by a company' })
  @Column({ nullable: true })
  companyId?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt!: Date;

  @ApiPropertyOptional({ type: () => CourseModule, isArray: true })
  @OneToMany(() => CourseModule, (module) => module.course)
  modules!: CourseModule[];

  @ApiPropertyOptional({ type: () => MeetingLink, isArray: true })
  @OneToMany(() => MeetingLink, (meetingLink) => meetingLink.course)
  meetingLinks!: MeetingLink[];

  @ApiPropertyOptional({
    description: 'Company entity if available',
    type: () => Company,
  })
  @ManyToOne(() => Company, (company) => company.courses, {
    nullable: true,
  })
  company?: Company;
}
