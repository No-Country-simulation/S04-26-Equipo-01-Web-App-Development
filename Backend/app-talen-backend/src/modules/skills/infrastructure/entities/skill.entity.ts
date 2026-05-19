import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { LearningModule } from '../../../learning/infrastructure/entities/learning-module.entity';
import { UserSkill } from './user-skill.entity';

@Entity('skills')
export class Skill {
  @ApiProperty({
    description: 'Identificador unico de la habilidad.',
    format: 'uuid',
    example: 'e7f022ea-cf26-4a10-a0d2-3cc4df093221',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Nombre normalizado de la habilidad.',
    example: 'typescript',
  })
  @Column({ unique: true })
  name!: string;

  @ApiProperty({
    description: 'Categoria funcional de la habilidad.',
    example: 'technical',
  })
  @Column()
  category!: string;

  @ApiHideProperty()
  @OneToMany(() => UserSkill, (userSkill) => userSkill.skill)
  users!: UserSkill[];

  @ApiHideProperty()
  @ManyToMany(() => LearningModule, (module) => module.skills)
  modules!: LearningModule[];
}
