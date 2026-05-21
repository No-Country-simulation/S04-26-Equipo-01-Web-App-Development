import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRecruiterSkillDto {
  @ApiProperty({
    description: 'Nombre de la skill',
    example: 'React',
  })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    description: 'Categoria de la skill',
    example: 'technical',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;
}
