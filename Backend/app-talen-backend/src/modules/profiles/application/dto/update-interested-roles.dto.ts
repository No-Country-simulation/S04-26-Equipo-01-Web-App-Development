import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsEnum,
} from 'class-validator';
import { InterestedRole } from '../../domain/interested-role.enum';

export class UpdateInterestedRolesDto {
  @ApiProperty({
    description: 'Lista de roles laborales de interés.',
    enum: InterestedRole,
    isArray: true,
    example: [InterestedRole.FRONTEND_DEVELOPER, InterestedRole.UX_UI_DESIGNER],
  })
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsEnum(InterestedRole, {
    each: true,
    message:
      'each interested role must be one of: BACKEND_DEVELOPER, FRONTEND_DEVELOPER, FULLSTACK_DEVELOPER, QA_TESTER, DATA_ANALYST, UX_UI_DESIGNER, SUPPORT_IT, CYBERSECURITY_TRAINEE',
  })
  interestedRoles!: InterestedRole[];
}
