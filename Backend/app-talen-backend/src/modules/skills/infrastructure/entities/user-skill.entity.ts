import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Profile } from '../../../profiles/infrastructure/entities/profile.entity';
import { Skill } from './skill.entity';

@Entity('user_skills')
@Unique(['profileId', 'skillId'])
export class UserSkill {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  profileId!: string;

  @Column()
  skillId!: string;

  @Column()
  level!: string;

  @Column({ nullable: true })
  evidence?: string;

  @Column({ nullable: true })
  source?: string;

  @ManyToOne(() => Profile, (profile) => profile.skills)
  profile!: Profile;

  @ManyToOne(() => Skill, (skill) => skill.users)
  skill!: Skill;
}
