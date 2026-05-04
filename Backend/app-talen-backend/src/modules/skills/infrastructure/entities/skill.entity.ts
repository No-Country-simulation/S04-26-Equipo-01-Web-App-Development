import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LearningModule } from '../../../learning/infrastructure/entities/learning-module.entity';
import { UserSkill } from './user-skill.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column()
  category!: string;

  @OneToMany(() => UserSkill, (userSkill) => userSkill.skill)
  users!: UserSkill[];

  @ManyToMany(() => LearningModule, (module) => module.skills)
  modules!: LearningModule[];
}
