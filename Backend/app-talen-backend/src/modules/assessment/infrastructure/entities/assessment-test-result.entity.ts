import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from '../../../profiles/infrastructure/entities/profile.entity';
import { AssessmentTestResult } from '../../domain/assessment-test-result.enum';
import { AssessmentTestType } from '../../domain/assessment-test-type.enum';

@Entity('assessment_test_results')
export class AssessmentTestResultEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  profileId!: string;

  @Column({
    type: 'enum',
    enum: AssessmentTestType,
  })
  type!: AssessmentTestType;

  @Column()
  title!: string;

  @Column({ type: 'jsonb' })
  answers!: Record<string, unknown>;

  @Column({ type: 'int' })
  score!: number;

  @Column({ type: 'int' })
  maxScore!: number;

  @Column({ type: 'int' })
  percentage!: number;

  @Column({
    type: 'enum',
    enum: AssessmentTestResult,
  })
  result!: AssessmentTestResult;

  @Column({ nullable: true })
  feedback?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Profile)
  profile!: Profile;
}
