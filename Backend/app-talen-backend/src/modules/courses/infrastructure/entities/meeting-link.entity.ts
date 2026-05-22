import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MeetingPlatform } from '../../domain/meeting-platform.enum';
import { Course } from './course.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('meeting_links')
export class MeetingLink {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Meeting link id', format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Parent course id', format: 'uuid' })
  @Column()
  courseId!: string;

  @ApiProperty({ description: 'Meeting URL' })
  @Column()
  url!: string;

  @ApiProperty({ description: 'Meeting platform', enum: MeetingPlatform })
  @Column({
    type: 'enum',
    enum: MeetingPlatform,
  })
  platform!: MeetingPlatform;

  @ApiPropertyOptional({
    description: 'Scheduled date and time for the workshop',
    type: String,
    format: 'date-time',
  })
  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt?: Date;

  @ApiPropertyOptional({ description: 'Meeting password if required' })
  @Column({ nullable: true })
  password?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @Column({ nullable: true })
  notes?: string;

  @ApiProperty({ description: 'User id who added the link' })
  @Column()
  addedBy!: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Course, (course) => course.meetingLinks, {
    onDelete: 'CASCADE',
  })
  course!: Course;
}
