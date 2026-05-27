import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { CompanyFeedback } from '../../../marketplace/infrastructure/entities/company-feedback.entity';
import { JobOpportunity } from '../../../marketplace/infrastructure/entities/job-opportunity.entity';
import { User } from '../../../users/infrastructure/entities/user.entity';
import { Course } from '../../../courses/infrastructure/entities/course.entity';

@Entity('companies')
export class Company {
  @ApiProperty({
    description: 'Identificador único de la empresa.',
    format: 'uuid',
    example: '8c40e1e6-2ed0-4f16-94b9-9d1f0b6f3c10',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Identificador del usuario propietario de la empresa.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @Column({ unique: true })
  userId!: string;

  @ApiProperty({
    description: 'Nombre legal o comercial de la empresa.',
    example: 'Acme Talent Labs',
  })
  @Column()
  name!: string;

  @ApiPropertyOptional({
    description: 'Industria principal de la empresa.',
    example: 'Technology',
  })
  @Column({ nullable: true })
  industry?: string;

  @ApiPropertyOptional({
    description: 'Sitio web de la empresa.',
    example: 'https://acme.example.com',
  })
  @Column({ nullable: true })
  website?: string;

  @ApiHideProperty()
  @OneToOne(() => User, (user) => user.company)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ApiHideProperty()
  @OneToMany(() => JobOpportunity, (opportunity) => opportunity.company)
  opportunities!: JobOpportunity[];

  @ApiHideProperty()
  @OneToMany(() => CompanyFeedback, (feedback) => feedback.company)
  feedbacks!: CompanyFeedback[];

  @ApiHideProperty()
  @OneToMany(() => Course, (course) => course.company)
  courses!: Course[];
}
