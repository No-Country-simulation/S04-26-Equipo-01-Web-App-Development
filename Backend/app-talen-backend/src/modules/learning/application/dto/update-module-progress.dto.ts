import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ModuleStatus } from '../../domain/module-status.enum';

export class UpdateModuleProgressDto {
  @IsOptional()
  @IsEnum(ModuleStatus, {
    message: 'status must be one of: PENDING, IN_PROGRESS, COMPLETED',
  })
  status?: ModuleStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;
}
