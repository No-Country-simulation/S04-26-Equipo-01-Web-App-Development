import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ModuleStatus } from '../../domain/module-status.enum';

export class UpdateModuleProgressDto {
  @ApiPropertyOptional({
    description: 'Estado del modulo de aprendizaje.',
    enum: ModuleStatus,
    example: ModuleStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(ModuleStatus, {
    message: 'status must be one of: PENDING, IN_PROGRESS, COMPLETED',
  })
  status?: ModuleStatus;

  @ApiPropertyOptional({
    description: 'Porcentaje de progreso del modulo en un rango de 0 a 100.',
    minimum: 0,
    maximum: 100,
    example: 65,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;
}
