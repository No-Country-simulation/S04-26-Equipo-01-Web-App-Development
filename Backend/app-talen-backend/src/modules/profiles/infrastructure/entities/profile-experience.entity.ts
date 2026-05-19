import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Profile } from './profile.entity';

@Entity('profile_experiences')
export class ProfileExperience {
  @ApiProperty({
    description: 'Identificador único de la experiencia.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440020',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Identificador del perfil asociado.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column()
  profileId!: string;

  @ApiProperty({
    description: 'Nombre de la empresa.',
    example: 'Acme Corp',
  })
  @Column()
  company!: string;

  @ApiProperty({
    description: 'Posición ocupada.',
    example: 'Frontend Developer',
  })
  @Column()
  position!: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio de la experiencia.',
    example: '2021-03',
  })
  @Column({ nullable: true })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de finalización de la experiencia.',
    example: '2024-02',
  })
  @Column({ nullable: true })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Descripción de la experiencia.',
    example: 'Built the main design system for the product team.',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Logros o highlights de la experiencia.',
    example: ['Improved performance by 30%'],
    isArray: true,
  })
  @Column({ type: 'text', array: true, default: [] })
  highlights!: string[];

  @ApiProperty({
    description: 'Orden de aparición dentro del perfil.',
    example: 1,
  })
  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Profile, (profile) => profile.experiences)
  profile!: Profile;
}
