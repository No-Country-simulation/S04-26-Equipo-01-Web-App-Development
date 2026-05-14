import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Assessment } from '../../../assessment/infrastructure/entities/assessment.entity';
import { CandidateApplication } from '../../../marketplace/infrastructure/entities/candidate-application.entity';
import { User } from '../../../users/infrastructure/entities/user.entity';
import { LearningPath } from '../../../learning/infrastructure/entities/learning-path.entity';
import { UserModuleProgress } from '../../../learning/infrastructure/entities/user-module-progress.entity';
import { UserSkill } from '../../../skills/infrastructure/entities/user-skill.entity';
import { InterestedRole } from '../../domain/interested-role.enum';
import { WorkModality } from '../../domain/work-modality.enum';
import { CvDiagnostic } from './cv-diagnostic.entity';
import { ProfileEducation } from './profile-education.entity';
import { ProfileExperience } from './profile-experience.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  userId!: string;

  @Column()
  fullName!: string;

  @Column({ nullable: true })
  ageRange?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({
    type: 'enum',
    enum: WorkModality,
    nullable: true,
  })
  preferredModality?: WorkModality;

  @Column({
    type: 'enum',
    enum: InterestedRole,
    array: true,
    default: [],
  })
  interestedRoles!: InterestedRole[];
  @Column({ nullable: true })
  currentStatus?: string;

  @Column({ nullable: true })
  headline?: string;

  @Column({ nullable: true })
  professionalBio?: string;

  @Column({ type: 'int', nullable: true })
  yearsExperience?: number;

  @Column({ type: 'int', default: 0 })
  employabilityScore!: number;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => Assessment, (assessment) => assessment.profile)
  assessments!: Assessment[];

  @OneToMany(() => LearningPath, (learningPath) => learningPath.profile)
  learningPaths!: LearningPath[];

  @OneToMany(() => UserModuleProgress, (progress) => progress.profile)
  progress!: UserModuleProgress[];

  @OneToMany(() => UserSkill, (skill) => skill.profile)
  skills!: UserSkill[];

  @OneToMany(() => CandidateApplication, (application) => application.profile)
  applications!: CandidateApplication[];

  @OneToMany(() => CvDiagnostic, (cvDiagnostic) => cvDiagnostic.profile)
  cvDiagnostics!: CvDiagnostic[];

  @OneToMany(() => ProfileExperience, (experience) => experience.profile)
  experiences!: ProfileExperience[];

  @OneToMany(() => ProfileEducation, (education) => education.profile)
  educations!: ProfileEducation[];
}
