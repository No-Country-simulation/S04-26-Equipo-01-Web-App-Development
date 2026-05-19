import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AssessmentLevel } from '../../domain/assessment-level.enum';
import { Profile } from '../../../profiles/infrastructure/entities/profile.entity';

@Entity('assessments')
export class Assessment {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440011' })
  @Column()
  profileId!: string;

  @ApiPropertyOptional({
    enum: AssessmentLevel,
    example: AssessmentLevel.BASIC,
  })
  @Column({
    type: 'enum',
    enum: AssessmentLevel,
    nullable: true,
  })
  digitalLevel?: AssessmentLevel;

  @ApiPropertyOptional({
    enum: AssessmentLevel,
    example: AssessmentLevel.INTERMEDIATE,
  })
  @Column({
    type: 'enum',
    enum: AssessmentLevel,
    nullable: true,
  })
  cognitiveLevel?: AssessmentLevel;

  @ApiPropertyOptional({
    enum: AssessmentLevel,
    example: AssessmentLevel.ADVANCED,
  })
  @Column({
    type: 'enum',
    enum: AssessmentLevel,
    nullable: true,
  })
  socioEmotionalLevel?: AssessmentLevel;

  @ApiPropertyOptional({
    example: 'Convertirme en frontend senior con foco en accesibilidad.',
  })
  @Column({ nullable: true })
  careerGoal?: string;

  @ApiProperty({
    example: { strengths: ['communication'], improvementAreas: ['testing'] },
  })
  @Column({ type: 'jsonb' })
  answers!: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'AI summary of the assessment results.',
  })
  @Column({ nullable: true })
  aiSummary?: string;

  @ApiPropertyOptional({
    example: { gaps: ['TypeScript generics', 'SQL joins'] },
  })
  @Column({ type: 'jsonb', nullable: true })
  detectedGaps?: Record<string, unknown>;

  @ApiProperty({ example: '2026-05-19T10:30:00.000Z' })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiPropertyOptional({ type: () => Profile })
  @ManyToOne(() => Profile, (profile) => profile.assessments)
  profile!: Profile;
}
