import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from '../../../profiles/infrastructure/entities/profile.entity';

@Entity('assessments')
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  profileId!: string;

  @Column({ nullable: true })
  digitalLevel?: string;

  @Column({ nullable: true })
  cognitiveLevel?: string;

  @Column({ nullable: true })
  socioEmotionalLevel?: string;

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
