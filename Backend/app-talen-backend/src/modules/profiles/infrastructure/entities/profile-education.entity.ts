import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Profile } from './profile.entity';

@Entity('profile_educations')
export class ProfileEducation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  profileId!: string;

  @Column()
  institution!: string;

  @Column()
  degree!: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ nullable: true })
  status?: string;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Profile, (profile) => profile.educations)
  profile!: Profile;
}
