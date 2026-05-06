import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Company } from '../../../companies/infrastructure/entities/company.entity';
import { CandidateApplication } from './candidate-application.entity';

@Entity('company_feedbacks')
export class CompanyFeedback {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column({ unique: true })
  applicationId!: string;

  @Column({ type: 'int', nullable: true })
  rating?: number;

  @Column({ nullable: true })
  comments?: string;

  @Column({ type: 'jsonb', nullable: true })
  strengths?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  improvements?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Company, (company) => company.feedbacks)
  company!: Company;

  @OneToOne(() => CandidateApplication, (application) => application.feedback)
  @JoinColumn({ name: 'applicationId' })
  application!: CandidateApplication;
}
