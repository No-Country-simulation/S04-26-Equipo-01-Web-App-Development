import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Skill } from '../../../skills/infrastructure/entities/skill.entity';
import { LearningModuleCategory } from '../../domain/learning-module-category.enum';
import { LearningPath } from './learning-path.entity';
import { UserModuleProgress } from './user-module-progress.entity';

@Entity('learning_modules')
export class LearningModule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  learningPathId!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: LearningModuleCategory,
  })
  category!: LearningModuleCategory;

  @Column({ nullable: true })
  contentUrl?: string;

  @Column({ type: 'int', nullable: true })
  durationMin?: number;

  @Column({ type: 'int' })
  order!: number;

  @ManyToOne(() => LearningPath, (learningPath) => learningPath.modules)
  learningPath!: LearningPath;

  @OneToMany(() => UserModuleProgress, (progress) => progress.module)
  progress!: UserModuleProgress[];

  @ManyToMany(() => Skill, (skill) => skill.modules)
  @JoinTable({
    name: 'learning_module_skills',
    joinColumn: { name: 'moduleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'skillId', referencedColumnName: 'id' },
  })
  skills!: Skill[];
}
