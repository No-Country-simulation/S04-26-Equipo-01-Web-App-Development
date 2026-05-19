import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Profile } from './profile.entity';

@Entity('profile_educations')
export class ProfileEducation {
  @ApiProperty({
    description: 'Identificador único de la formación.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440021',
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
    description: 'Institución educativa.',
    example: 'Universidad de Buenos Aires',
  })
  @Column()
  institution!: string;

  @ApiProperty({
    description: 'Título o grado obtenido.',
    example: 'Computer Science',
  })
  @Column()
  degree!: string;

  @ApiPropertyOptional({
    description: 'Detalles adicionales de la formación.',
    example: 'Thesis focused on HCI.',
  })
  @Column({ type: 'text', nullable: true })
  details?: string;

  @ApiPropertyOptional({
    description: 'Estado académico de la formación.',
    example: 'Completed',
  })
  @Column({ nullable: true })
  status?: string;

  @ApiProperty({
    description: 'Orden de aparición dentro del perfil.',
    example: 1,
  })
  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Profile, (profile) => profile.educations)
  profile!: Profile;
}
