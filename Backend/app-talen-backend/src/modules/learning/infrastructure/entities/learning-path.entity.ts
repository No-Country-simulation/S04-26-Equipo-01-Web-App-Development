import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from '../../../profiles/infrastructure/entities/profile.entity';
import { LearningModule } from './learning-module.entity';

@Entity('learning_paths')
export class LearningPath {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  profileId!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  objective?: string;

  @Column({ default: true })
  aiGenerated!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Profile, (profile) => profile.learningPaths)
  profile!: Profile;

  @OneToMany(() => LearningModule, (module) => module.learningPath)
  modules!: LearningModule[];
}
