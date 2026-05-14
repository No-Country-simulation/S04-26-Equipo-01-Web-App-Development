import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('profile_experiences')
export class ProfileExperience {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  profileId!: string;

  @Column()
  company!: string;

  @Column()
  position!: string;

  @Column({ nullable: true })
  startDate?: string;

  @Column({ nullable: true })
  endDate?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', array: true, default: [] })
  highlights!: string[];

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Profile, (profile) => profile.experiences)
  profile!: Profile;
}
