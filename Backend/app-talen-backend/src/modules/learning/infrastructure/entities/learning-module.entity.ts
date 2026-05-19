import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Skill } from '../../../skills/infrastructure/entities/skill.entity';
import { LearningModuleCategory } from '../../domain/learning-module-category.enum';
import { LearningPath } from './learning-path.entity';
import { UserModuleProgress } from './user-module-progress.entity';

@Entity('learning_modules')
export class LearningModule {
  @ApiProperty({
    description: 'Identificador unico del modulo de aprendizaje.',
    example: 'e7f022ea-cf26-4a10-a0d2-3cc4df093221',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Identificador de la ruta de aprendizaje asociada.',
    example: 'ad2c6f36-c8f1-4f4a-89fc-8a5860355dc2',
  })
  @Column()
  learningPathId!: string;

  @ApiProperty({
    description: 'Titulo del modulo.',
    example: 'Fundamentos de APIs REST con NestJS',
  })
  @Column()
  title!: string;

  @ApiPropertyOptional({
    description: 'Descripcion breve del objetivo del modulo.',
    example: 'Diseno de endpoints, validaciones y manejo de errores comunes.',
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Categoria del modulo de aprendizaje.',
    enum: LearningModuleCategory,
    example: LearningModuleCategory.DIGITAL,
  })
  @Column({
    type: 'enum',
    enum: LearningModuleCategory,
  })
  category!: LearningModuleCategory;

  @ApiPropertyOptional({
    description: 'URL del contenido del modulo (curso, recurso o actividad).',
    example: 'https://plataforma.example.com/cursos/nestjs-rest',
  })
  @Column({ nullable: true })
  contentUrl?: string;

  @ApiPropertyOptional({
    description: 'Duracion estimada del modulo en minutos.',
    example: 45,
  })
  @Column({ type: 'int', nullable: true })
  durationMin?: number;

  @ApiProperty({
    description: 'Orden del modulo dentro de la ruta.',
    example: 1,
  })
  @Column({ type: 'int' })
  order!: number;

  @ApiProperty({
    description: 'Ruta de aprendizaje a la que pertenece el modulo.',
    type: () => LearningPath,
  })
  @ManyToOne(() => LearningPath, (learningPath) => learningPath.modules)
  learningPath!: LearningPath;

  @ApiProperty({
    description: 'Registros de progreso asociados al modulo.',
    type: () => UserModuleProgress,
    isArray: true,
  })
  @OneToMany(() => UserModuleProgress, (progress) => progress.module)
  progress!: UserModuleProgress[];

  @ApiProperty({
    description: 'Habilidades relacionadas al modulo.',
    type: () => Skill,
    isArray: true,
  })
  @ManyToMany(() => Skill, (skill) => skill.modules)
  @JoinTable({
    name: 'learning_module_skills',
    joinColumn: { name: 'moduleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'skillId', referencedColumnName: 'id' },
  })
  skills!: Skill[];
}
