import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Company } from '../../../companies/infrastructure/entities/company.entity';
import { Profile } from '../../../profiles/infrastructure/entities/profile.entity';
import { UserRole } from '../../domain/user-role.enum';

@Entity('users')
export class User {
  @ApiProperty({
    description: 'Identificador único del usuario.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'Correo electrónico del usuario.', example: 'talent@example.com' })
  @Column({ unique: true })
  email!: string;

  @ApiHideProperty()
  @Column()
  password!: string;

  @ApiPropertyOptional({ description: 'URL de la imagen de perfil del usuario.', example: 'https://example.com/avatar.png' })
  @Column({ nullable: true })
  imageUrl?: string;

  @ApiProperty({ description: 'Rol del usuario en la plataforma.', enum: UserRole, example: UserRole.TALENT })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TALENT,
  })
  role!: UserRole;

  @ApiProperty({ description: 'Fecha de creación del registro.', example: '2026-05-19T10:30:00.000Z' })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({ description: 'Fecha de última actualización del registro.', example: '2026-05-19T10:30:00.000Z' })
  @UpdateDateColumn()
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Perfil asociado al usuario.', type: () => Profile })
  @OneToOne(() => Profile, (profile) => profile.user)
  profile?: Profile;

  @ApiPropertyOptional({ description: 'Empresa asociada si aplica.', type: () => Company })
  @OneToOne(() => Company, (company) => company.user)
  company?: Company;
}
