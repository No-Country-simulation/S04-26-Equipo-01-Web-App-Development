import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../../companies/infrastructure/entities/company.entity';
import { Profile } from '../../../profiles/infrastructure/entities/profile.entity';
import { UserRole } from '../../domain/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TALENT,
  })
  role!: UserRole;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile?: Profile;

  @OneToOne(() => Company, (company) => company.user)
  company?: Company;
}
