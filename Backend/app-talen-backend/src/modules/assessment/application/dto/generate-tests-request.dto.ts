import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GenerateTestsRequestDto {
  @ApiPropertyOptional({
    description: 'Identificador opcional del perfil para generar tests.',
    example: 'c4b4e87a-c7f8-4cf8-a855-637b6a4b57e1',
  })
  @IsOptional()
  @IsString()
  profileId?: string;
}
