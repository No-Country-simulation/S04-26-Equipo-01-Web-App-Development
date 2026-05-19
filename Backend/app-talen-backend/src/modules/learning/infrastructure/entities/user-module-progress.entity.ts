import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Profile } from '../../../profiles/infrastructure/entities/profile.entity';
import { ModuleStatus } from '../../domain/module-status.enum';
import { LearningModule } from './learning-module.entity';

@Entity('user_module_progress')
@Unique(['profileId', 'moduleId'])
export class UserModuleProgress {
  @ApiProperty({
    description: 'Identificador unico del registro de progreso.',
    example: '605d2455-fdc0-4fbe-a20e-1292f6e69928',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Identificador del perfil propietario del progreso.',
    example: 'c4b4e87a-c7f8-4cf8-a855-637b6a4b57e1',
  })
  @Column()
  profileId!: string;

  @ApiProperty({
    description: 'Identificador del modulo de aprendizaje.',
    example: 'e7f022ea-cf26-4a10-a0d2-3cc4df093221',
  })
  @Column()
  moduleId!: string;

  @ApiProperty({
    description: 'Estado actual del avance del modulo.',
    enum: ModuleStatus,
    example: ModuleStatus.IN_PROGRESS,
  })
  @Column({
    type: 'enum',
    enum: ModuleStatus,
    default: ModuleStatus.PENDING,
  })
  status!: ModuleStatus;

  @ApiProperty({
    description: 'Porcentaje de avance del modulo (0-100).',
    example: 65,
    minimum: 0,
    maximum: 100,
  })
  @Column({ type: 'int', default: 0 })
  progress!: number;

  @ApiPropertyOptional({
    description: 'Fecha en la que el modulo fue completado.',
    example: '2026-05-19T15:10:00.000Z',
  })
  @Column({ nullable: true })
  completedAt?: Date;

  @ApiProperty({
    description: 'Perfil asociado al progreso.',
    type: () => Profile,
  })
  @ManyToOne(() => Profile, (profile) => profile.progress)
  profile!: Profile;

  @ApiProperty({
    description: 'Modulo asociado al progreso.',
    type: () => LearningModule,
  })
  @ManyToOne(() => LearningModule, (module) => module.progress)
  module!: LearningModule;
}
