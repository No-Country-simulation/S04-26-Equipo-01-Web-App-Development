import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Profile } from './profile.entity';

@Entity('cv_diagnostics')
export class CvDiagnostic {
  @ApiProperty({
    description: 'Identificador único del diagnóstico.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440010',
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

  @ApiPropertyOptional({
    description: 'Nombre del archivo analizado.',
    example: 'ada-lovelace-cv.pdf',
  })
  @Column({ nullable: true })
  fileName?: string;

  @ApiProperty({
    description: 'Longitud del texto extraído del CV.',
    example: 5420,
  })
  @Column({ type: 'int', default: 0 })
  extractedTextLength!: number;

  @ApiPropertyOptional({
    description: 'Texto bruto del CV almacenado para auditoría.',
    example: 'Ada Lovelace is a frontend developer...',
  })
  @Column({ type: 'text', nullable: true })
  rawText?: string;

  @ApiPropertyOptional({
    description: 'Resumen generado o capturado del CV.',
    example: 'Frontend profile with strong React and accessibility background.',
  })
  @Column({ type: 'text', nullable: true })
  summary?: string;

  @ApiProperty({
    description: 'Lista de habilidades técnicas detectadas.',
    example: ['TypeScript', 'React', 'NestJS'],
    isArray: true,
  })
  @Column({ type: 'text', array: true, default: [] })
  technicalSkills!: string[];

  @ApiProperty({
    description: 'Lista de habilidades personales detectadas.',
    example: ['Communication', 'Teamwork'],
    isArray: true,
  })
  @Column({ type: 'text', array: true, default: [] })
  personalSkills!: string[];

  @ApiPropertyOptional({
    description: 'Snapshot estructurado del CV guardado en el diagnóstico.',
    example: {
      profile: { fullName: 'Ada Lovelace', email: 'talent@example.com' },
      skills: { technical: ['React'], personal: ['Teamwork'] },
    },
  })
  @Column({ type: 'jsonb', nullable: true })
  snapshot?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Respuesta original del motor de IA.',
    example: { summary: 'Frontend profile', suggestedSkills: [] },
  })
  @Column({ type: 'jsonb', nullable: true })
  aiAnalysis?: Record<string, unknown>;

  @ApiProperty({
    description: 'Fecha de creación del diagnóstico.',
    example: '2026-05-19T12:34:56.000Z',
  })
  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Profile, (profile) => profile.cvDiagnostics)
  profile!: Profile;
}
