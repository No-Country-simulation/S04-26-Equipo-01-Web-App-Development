import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Profile } from '../../../profiles/infrastructure/entities/profile.entity';
import { LearningModule } from './learning-module.entity';

@Entity('learning_paths')
export class LearningPath {
  @ApiProperty({
    description: 'Identificador unico de la ruta de aprendizaje.',
    example: 'ad2c6f36-c8f1-4f4a-89fc-8a5860355dc2',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Identificador del perfil propietario de la ruta.',
    example: 'c4b4e87a-c7f8-4cf8-a855-637b6a4b57e1',
  })
  @Column()
  profileId!: string;

  @ApiProperty({
    description: 'Titulo visible de la ruta de aprendizaje.',
    example: 'Ruta Backend Nivelacion Node.js',
  })
  @Column()
  title!: string;

  @ApiPropertyOptional({
    description: 'Objetivo principal de aprendizaje.',
    example: 'Mejorar empleabilidad como desarrollador backend junior',
  })
  @Column({ nullable: true })
  objective?: string;

  @ApiProperty({
    description: 'Indica si la ruta fue generada por IA.',
    example: true,
  })
  @Column({ default: true })
  aiGenerated!: boolean;

  @ApiPropertyOptional({
    description: 'Track recomendado por el analisis de assessment.',
    example: 'Backend Development',
  })
  @Column({ nullable: true })
  recommendedTrack?: string;

  @ApiPropertyOptional({
    description: 'Nivel de confianza de la recomendacion (0-100).',
    example: 82,
  })
  @Column({ type: 'int', nullable: true })
  confidence?: number;

  @ApiPropertyOptional({
    description: 'Motivo resumido de la recomendacion.',
    example:
      'Coincidencia alta con habilidades tecnicas y objetivo profesional.',
  })
  @Column({ nullable: true })
  matchingReason?: string;

  @ApiPropertyOptional({
    description: 'Tracks alternativos sugeridos por la IA.',
    example: [
      { track: 'QA Automation', confidence: 70 },
      { track: 'DevOps Junior', confidence: 61 },
    ],
  })
  @Column({ type: 'jsonb', nullable: true })
  alternativeTracks?: Record<string, unknown>[];

  @ApiProperty({
    description: 'Fecha de creacion de la ruta.',
    example: '2026-05-19T14:30:00.000Z',
  })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({
    description: 'Perfil asociado a la ruta.',
    type: () => Profile,
  })
  @ManyToOne(() => Profile, (profile) => profile.learningPaths)
  profile!: Profile;

  @ApiProperty({
    description: 'Modulos incluidos en la ruta de aprendizaje.',
    type: () => LearningModule,
    isArray: true,
  })
  @OneToMany(() => LearningModule, (module) => module.learningPath)
  modules!: LearningModule[];
}
