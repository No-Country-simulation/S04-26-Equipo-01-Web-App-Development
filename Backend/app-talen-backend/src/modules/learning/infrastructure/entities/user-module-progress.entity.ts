import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Profile } from '../../../profiles/infrastructure/entities/profile.entity';
import { ModuleStatus } from '../../domain/module-status.enum';
import { LearningModule } from './learning-module.entity';

@Entity('user_module_progress')
@Unique(['profileId', 'moduleId'])
export class UserModuleProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  profileId!: string;

  @Column()
  moduleId!: string;

  @Column({
    type: 'enum',
    enum: ModuleStatus,
    default: ModuleStatus.PENDING,
  })
  status!: ModuleStatus;

  @Column({ type: 'int', default: 0 })
  progress!: number;

  @Column({ nullable: true })
  completedAt?: Date;

  @ManyToOne(() => Profile, (profile) => profile.progress)
  profile!: Profile;

  @ManyToOne(() => LearningModule, (module) => module.progress)
  module!: LearningModule;
}
