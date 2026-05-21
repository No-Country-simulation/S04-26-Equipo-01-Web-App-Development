import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../auth/infrastructure/types/authenticated-request.type';
import { AnalyzeCvDto } from '../application/dto/analyze-cv.dto';
import { CreateProfileDto } from '../application/dto/create-profile.dto';
import { SaveCvDiagnosticDto } from '../application/dto/save-cv-diagnostic.dto';
import { UpdateInterestedRolesDto } from '../application/dto/update-interested-roles.dto';
import { UpdateProfileDto } from '../application/dto/update-profile.dto';
import { UpdateWorkPreferencesDto } from '../application/dto/update-work-preferences.dto';
import { CvAnalysisResponse } from '../domain/cv-analysis-response.type';
import { UploadedCvFile } from '../domain/uploaded-cv-file.type';
import { ProfilesService } from '../application/profiles.service';
import { CvDiagnostic } from './entities/cv-diagnostic.entity';
import { Profile } from './entities/profile.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Perfiles')
@ApiBearerAuth()
@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post('me')
  @ApiOperation({
    summary: 'Crear mi perfil',
    description:
      'Crea un nuevo perfil para el usuario autenticado. Útil para el registro inicial.',
  })
  @ApiBody({
    type: CreateProfileDto,
    description: 'Datos necesarios para crear el perfil.',
  })
  @ApiResponse({
    status: 201,
    description: 'Perfil creado exitosamente.',
    type: Profile,
  })
  createMe(
    @Req() request: AuthenticatedRequest,
    @Body() createProfileDto: CreateProfileDto,
  ): Promise<Profile> {
    return this.profilesService.createMe(request.user, createProfileDto);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Obtener mi perfil',
    description: 'Devuelve la información del perfil del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil encontrado.',
    type: Profile,
  })
  getMe(@Req() request: AuthenticatedRequest): Promise<Profile> {
    return this.profilesService.getMe(request.user);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Actualizar mi perfil',
    description:
      'Permite modificar los datos del perfil del usuario autenticado.',
  })
  @ApiBody({
    type: UpdateProfileDto,
    description: 'Datos a actualizar en el perfil.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado.',
    type: Profile,
  })
  updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    return this.profilesService.updateMe(request.user, updateProfileDto);
  }

  @Patch('me/preferences')
  @ApiOperation({
    summary: 'Actualizar mis preferencias laborales',
    description:
      'Actualiza las preferencias de trabajo del usuario (país, modalidad, etc.).',
  })
  @ApiBody({
    type: UpdateWorkPreferencesDto,
    description: 'Preferencias laborales a actualizar.',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferencias actualizadas.',
    type: Profile,
  })
  updateMyWorkPreferences(
    @Req() request: AuthenticatedRequest,
    @Body() updateWorkPreferencesDto: UpdateWorkPreferencesDto,
  ): Promise<Profile> {
    return this.profilesService.updateMyWorkPreferences(
      request.user,
      updateWorkPreferencesDto,
    );
  }

  @Patch('me/interested-roles')
  @ApiOperation({
    summary: 'Actualizar roles de interés',
    description:
      'Permite definir o modificar los roles laborales de interés del usuario.',
  })
  @ApiBody({
    type: UpdateInterestedRolesDto,
    description: 'Lista de roles de interés.',
  })
  @ApiResponse({
    status: 200,
    description: 'Roles de interés actualizados.',
    type: Profile,
  })
  updateMyInterestedRoles(
    @Req() request: AuthenticatedRequest,
    @Body() updateInterestedRolesDto: UpdateInterestedRolesDto,
  ): Promise<Profile> {
    return this.profilesService.updateMyInterestedRoles(
      request.user,
      updateInterestedRolesDto,
    );
  }

  @Patch('me/employability-score')
  @ApiOperation({
    summary: 'Recalcular mi puntaje de empleabilidad',
    description:
      'Recalcula el puntaje de empleabilidad del usuario según los datos actuales.',
  })
  @ApiResponse({
    status: 200,
    description: 'Puntaje recalculado.',
    type: Profile,
  })
  recalculateMyEmployabilityScore(
    @Req() request: AuthenticatedRequest,
  ): Promise<Profile> {
    return this.profilesService.recalculateMyEmployabilityScore(request.user);
  }

  @Post('me/cv/analyze')
  @ApiOperation({
    summary: 'Analizar mi CV con IA',
    description:
      'Sube y analiza tu currículum (CV) usando inteligencia artificial para extraer información relevante y sugerir mejoras.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo PDF del CV y opciones de análisis.',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo PDF del currículum (máx. 5MB)',
        },
        extractedText: {
          type: 'string',
          description: 'Texto extraído manualmente del CV (opcional)',
        },
        applyToProfile: {
          type: 'boolean',
          description:
            'Si es true, aplica los datos sugeridos al perfil automáticamente.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Análisis exitoso. Devuelve sugerencias y datos extraídos.',
    type: Object,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  analyzeMyCv(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: UploadedCvFile | undefined,
    @Body() analyzeCvDto: AnalyzeCvDto,
  ): Promise<CvAnalysisResponse> {
    return this.profilesService.analyzeMyCv(request.user, file, analyzeCvDto);
  }

  @Post('me/cv/diagnostics')
  @ApiOperation({
    summary: 'Guardar diagnóstico inicial de CV',
    description:
      'Guarda el resultado del CV parseado en frontend (perfil, skills técnicas/personales y resumen inicial).',
  })
  @ApiBody({
    type: SaveCvDiagnosticDto,
    description: 'Datos del diagnóstico inicial del CV.',
  })
  @ApiResponse({
    status: 201,
    description: 'Diagnóstico guardado exitosamente.',
    type: CvDiagnostic,
  })
  saveMyCvDiagnostic(
    @Req() request: AuthenticatedRequest,
    @Body() saveCvDiagnosticDto: SaveCvDiagnosticDto,
  ): Promise<CvDiagnostic> {
    return this.profilesService.saveMyCvDiagnostic(
      request.user,
      saveCvDiagnosticDto,
    );
  }

  @Get('me/cv/diagnostics')
  @ApiOperation({
    summary: 'Listar historial de diagnósticos de CV',
    description:
      'Devuelve todos los diagnósticos de CV del usuario autenticado, del más reciente al más antiguo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de diagnósticos obtenido.',
    type: [CvDiagnostic],
  })
  findMyCvDiagnostics(
    @Req() request: AuthenticatedRequest,
  ): Promise<CvDiagnostic[]> {
    return this.profilesService.findMyCvDiagnostics(request.user);
  }

  @Get('me/cv/diagnostics/latest')
  @ApiOperation({
    summary: 'Obtener último diagnóstico de CV',
    description:
      'Devuelve el diagnóstico de CV más reciente del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Último diagnóstico obtenido.',
    type: CvDiagnostic,
  })
  findMyLatestCvDiagnostic(
    @Req() request: AuthenticatedRequest,
  ): Promise<CvDiagnostic> {
    return this.profilesService.findMyLatestCvDiagnostic(request.user);
  }
}
