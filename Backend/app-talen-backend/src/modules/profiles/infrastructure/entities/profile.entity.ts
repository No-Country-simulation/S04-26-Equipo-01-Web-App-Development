import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'Identificador único del perfil.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Identificador del usuario propietario del perfil.',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Column({ unique: true })
  userId!: string;

  @ApiProperty({
    description: 'Nombre completo del usuario.',
    example: 'Ada Lovelace',
  })
  @Column()
  fullName!: string;

  @ApiPropertyOptional({
    description: 'Rango etario del usuario.',
    example: '25-34',
  })
  @Column({ nullable: true })
  ageRange?: string;

  @ApiPropertyOptional({
    description: 'Ubicación principal del usuario.',
    example: 'Buenos Aires, Argentina',
  })
  @Column({ nullable: true })
  location?: string;

  @ApiPropertyOptional({
    description: 'País preferido para trabajar.',
    example: 'Argentina',
  })
  @Column({ nullable: true })
  country?: string;

  @ApiPropertyOptional({
    description: 'Modalidad laboral preferida.',
    enum: WorkModality,
    example: WorkModality.HIBRIDO,
  })
  @Column({
    type: 'enum',
    enum: WorkModality,
    nullable: true,
  })
  preferredModality?: WorkModality;

  @ApiProperty({
    description: 'Roles laborales de interés.',
    enum: InterestedRole,
    isArray: true,
    example: [InterestedRole.FRONTEND_DEVELOPER, InterestedRole.UX_UI_DESIGNER],
  })
  @Column({
    type: 'enum',
    enum: InterestedRole,
    array: true,
    default: [],
  })
  interestedRoles!: InterestedRole[];

  @ApiPropertyOptional({
    description: 'Estado laboral actual.',
    example: 'Looking for opportunities',
  })
  @Column({ nullable: true })
  currentStatus?: string;

  @ApiPropertyOptional({
    description: 'Headline o título profesional breve.',
    example: 'Frontend developer focused on React and TypeScript',
  })
  @Column({ nullable: true })
  headline?: string;

  @ApiPropertyOptional({
    description: 'Resumen profesional del usuario.',
    example:
      'Frontend developer with experience building accessible and scalable web applications.',
  })
  @Column({ nullable: true })
  professionalBio?: string;

  @ApiPropertyOptional({
    description: 'Años de experiencia profesional.',
    example: 5,
  })
  @Column({ type: 'int', nullable: true })
  yearsExperience?: number;

  @ApiProperty({
    description: 'Puntaje de empleabilidad calculado.',
    example: 82,
  })
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
