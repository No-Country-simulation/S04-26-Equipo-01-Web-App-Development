import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from '../../../profiles/infrastructure/entities/profile.entity';
import { ApplicationStatus } from '../../domain/application-status.enum';
import { CompanyFeedback } from './company-feedback.entity';
import { JobOpportunity } from './job-opportunity.entity';

@Entity('candidate_applications')
export class CandidateApplication {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  profileId!: string;

  @Column()
  opportunityId!: string;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PRESELECTED,
  })
  status!: ApplicationStatus;

  @Column({ type: 'int', default: 0 })
  matchScore!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Profile, (profile) => profile.applications)
  profile!: Profile;

  @ManyToOne(() => JobOpportunity, (opportunity) => opportunity.applications)
  opportunity!: JobOpportunity;

  @OneToOne(() => CompanyFeedback, (feedback) => feedback.application)
  feedback?: CompanyFeedback;
}
