import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Profile } from '../../../profiles/infrastructure/entities/profile.entity';
import { SkillLevel } from '../../domain/skill-level.enum';
import { Skill } from './skill.entity';

@Entity('user_skills')
@Unique(['profileId', 'skillId'])
export class UserSkill {
  @ApiProperty({
    description: 'Identificador unico del registro de habilidad del usuario.',
    format: 'uuid',
    example: '605d2455-fdc0-4fbe-a20e-1292f6e69928',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Identificador del perfil asociado.',
    format: 'uuid',
    example: 'c4b4e87a-c7f8-4cf8-a855-637b6a4b57e1',
  })
  @Column()
  profileId!: string;

  @ApiProperty({
    description: 'Identificador de la habilidad catalogada.',
    format: 'uuid',
    example: 'e7f022ea-cf26-4a10-a0d2-3cc4df093221',
  })
  @Column()
  skillId!: string;

  @ApiProperty({
    description: 'Nivel de dominio declarado para la habilidad.',
    enum: SkillLevel,
    example: SkillLevel.ADVANCED,
  })
  @Column({
    type: 'enum',
    enum: SkillLevel,
  })
  level!: SkillLevel;

  @ApiPropertyOptional({
    description: 'Evidencia opcional de la habilidad.',
    example: 'https://www.credly.com/badges/typescript',
  })
  @Column({ nullable: true })
  evidence?: string;

  @ApiPropertyOptional({
    description: 'Fuente opcional de aprendizaje de la habilidad.',
    example: 'bootcamp',
  })
  @Column({ nullable: true })
  source?: string;

  @ApiHideProperty()
  @ManyToOne(() => Profile, (profile) => profile.skills)
  profile!: Profile;

  @ApiProperty({
    description: 'Habilidad asociada con sus metadatos base.',
    type: () => Skill,
  })
  @ManyToOne(() => Skill, (skill) => skill.users)
  skill!: Skill;
}
