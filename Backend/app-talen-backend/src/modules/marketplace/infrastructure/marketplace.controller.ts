import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../auth/infrastructure/types/authenticated-request.type';
import { MarketplaceService } from '../domain/marketplace.service';

@ApiTags('Marketplace')
@ApiBearerAuth()
@Controller('marketplace')
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('me/feedback')
  @ApiOperation({
    summary: 'Obtener feedback de reclutadores para el talento autenticado',
    description:
      'Retorna feedbacks asociados a postulaciones del talento autenticado en estado seleccionado/finalista/aceptado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Feedbacks obtenidos correctamente.',
    isArray: true,
  })
  async getMyTalentFeedback(@Req() request: AuthenticatedRequest) {
    return this.marketplaceService.getMyTalentFeedback(request.user.userId);
  }
}
