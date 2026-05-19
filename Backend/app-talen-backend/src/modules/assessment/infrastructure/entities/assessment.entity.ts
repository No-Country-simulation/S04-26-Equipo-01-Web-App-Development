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
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  profileId!: string;

  @Column({
    type: 'enum',
    enum: AssessmentLevel,
    nullable: true,
  })
  digitalLevel?: AssessmentLevel;

  @Column({
    type: 'enum',
    enum: AssessmentLevel,
    nullable: true,
  })
  cognitiveLevel?: AssessmentLevel;

  @Column({
    type: 'enum',
    enum: AssessmentLevel,
    nullable: true,
  })
  socioEmotionalLevel?: AssessmentLevel;

  @Column({ nullable: true })
  careerGoal?: string;

  @Column({ type: 'jsonb' })
  answers!: Record<string, unknown>;

  @Column({ nullable: true })
  aiSummary?: string;

  @Column({ type: 'jsonb', nullable: true })
  detectedGaps?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Profile, (profile) => profile.assessments)
  profile!: Profile;
}
