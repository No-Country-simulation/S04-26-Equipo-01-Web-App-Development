import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Company } from '../../../companies/infrastructure/entities/company.entity';
import { CandidateApplication } from './candidate-application.entity';

@Entity('job_opportunities')
export class JobOpportunity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column({ type: 'jsonb', nullable: true })
  requiredSkills?: Record<string, unknown>;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  modality?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Company, (company) => company.opportunities)
  company!: Company;

  @OneToMany(() => CandidateApplication, (application) => application.opportunity)
  applications!: CandidateApplication[];
}
