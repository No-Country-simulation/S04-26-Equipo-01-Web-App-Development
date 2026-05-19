import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from '../../../profiles/infrastructure/entities/profile.entity';
import { AssessmentTestResult } from '../../domain/assessment-test-result.enum';
import { AssessmentTestType } from '../../domain/assessment-test-type.enum';

@Entity('assessment_test_results')
export class AssessmentTestResultEntity {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440020' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440011' })
  @Column()
  profileId!: string;

  @ApiProperty({ enum: AssessmentTestType, example: AssessmentTestType.TECHNICAL })
  @Column({
    type: 'enum',
    enum: AssessmentTestType,
  })
  type!: AssessmentTestType;

  @ApiProperty({ example: 'Prueba tecnica' })
  @Column()
  title!: string;

  @ApiProperty({ example: { tech_api_1: 'b', tech_validation_1: 'b' } })
  @Column({ type: 'jsonb' })
  answers!: Record<string, unknown>;

  @ApiProperty({ example: 80 })
  @Column({ type: 'int' })
  score!: number;

  @ApiProperty({ example: 100 })
  @Column({ type: 'int' })
  maxScore!: number;

  @ApiProperty({ example: 80 })
  @Column({ type: 'int' })
  percentage!: number;

  @ApiProperty({ enum: AssessmentTestResult, example: AssessmentTestResult.HIGH })
  @Column({
    type: 'enum',
    enum: AssessmentTestResult,
  })
  result!: AssessmentTestResult;

  @ApiPropertyOptional({ example: 'Resultado alto en la prueba tecnica.' })
  @Column({ nullable: true })
  feedback?: string;

  @ApiProperty({ example: '2026-05-19T10:30:00.000Z' })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiPropertyOptional({ type: () => Profile })
  @ManyToOne(() => Profile)
  profile!: Profile;
}
