import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AnalyzeCvDto {
  @ApiPropertyOptional({
    description:
      'Texto del CV extraído manualmente si no se envía archivo o si se prefiere reutilizar el texto ya procesado.',
    example:
      'Frontend developer with 5 years of experience in React, TypeScript and accessibility.',
  })
  @IsOptional()
  @IsString()
  extractedText?: string;

  @ApiPropertyOptional({
    description:
      'Si es true, los datos sugeridos por la IA se aplican al perfil automáticamente.',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  applyToProfile?: boolean;
}
