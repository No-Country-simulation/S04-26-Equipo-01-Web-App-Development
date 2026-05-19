import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GenerateTestsRequestDto {
  @ApiPropertyOptional({
    description:
      'Identificador del perfil a partir del cual se generarían los tests.',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @IsOptional()
  @IsString()
  profileId?: string;
}
