import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('cv_diagnostics')
export class CvDiagnostic {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  profileId!: string;

  @Column({ nullable: true })
  fileName?: string;

  @Column({ type: 'int', default: 0 })
  extractedTextLength!: number;

  @Column({ type: 'text', nullable: true })
  rawText?: string;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ type: 'text', array: true, default: [] })
  technicalSkills!: string[];

  @Column({ type: 'text', array: true, default: [] })
  personalSkills!: string[];

  @Column({ type: 'jsonb', nullable: true })
  snapshot?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  aiAnalysis?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Profile, (profile) => profile.cvDiagnostics)
  profile!: Profile;
}
