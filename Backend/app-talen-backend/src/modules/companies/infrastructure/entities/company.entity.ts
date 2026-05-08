import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CompanyFeedback } from '../../../marketplace/infrastructure/entities/company-feedback.entity';
import { JobOpportunity } from '../../../marketplace/infrastructure/entities/job-opportunity.entity';
import { User } from '../../../users/infrastructure/entities/user.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  userId!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  industry?: string;

  @Column({ nullable: true })
  website?: string;

  @OneToOne(() => User, (user) => user.company)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => JobOpportunity, (opportunity) => opportunity.company)
  opportunities!: JobOpportunity[];

  @OneToMany(() => CompanyFeedback, (feedback) => feedback.company)
  feedbacks!: CompanyFeedback[];
}
