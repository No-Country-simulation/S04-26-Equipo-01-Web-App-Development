import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  ParseUUIDPipe,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../auth/infrastructure/types/authenticated-request.type';
import { CoursesService } from '../application/courses.service';
import { CreateCourseDto } from '../application/dto/create-course.dto';
import { UpdateCourseDto } from '../application/dto/update-course.dto';
import { CreateCourseModuleDto } from '../application/dto/create-course-module.dto';
import { UpdateCourseModuleDto } from '../application/dto/update-course-module.dto';
import { AddMeetingLinkDto } from '../application/dto/add-meeting-link.dto';
import { Course } from './entities/course.entity';
import { CourseModule } from './entities/course-module.entity';
import { MeetingLink } from './entities/meeting-link.entity';

const UUID_V4_PARAM_PIPE = new ParseUUIDPipe({
  version: '4',
  exceptionFactory: () =>
    new BadRequestException({
      statusCode: 400,
      message: 'ID invalido: debe ser un UUID v4',
      error: 'Bad Request',
    }),
});

const createCourseRequestExample = {
  title: 'Introduccion a NestJS',
  description: 'Curso base para construir APIs con NestJS.',
  status: 'DRAFT',
};

const updateCourseRequestExample = {
  title: 'Introduccion a NestJS y TypeORM',
  status: 'PENDING_REVIEW',
};

const createModuleRequestExample = {
  title: 'Fundamentos de controladores',
  description: 'Primer modulo del curso.',
  order: 1,
  videoUrl: 'https://example.com/videos/controladores',
  documentationUrl: 'https://docs.example.com/controladores',
  durationMin: 45,
};

const addMeetingLinkRequestExample = {
  url: 'https://meet.google.com/xxx-xxxx-xxx',
  platform: 'GOOGLE_MEET',
  scheduledAt: '2026-06-15T19:00:00.000Z',
  password: 'meet-password',
  notes: 'Sesión de preguntas y respuestas.',
};

const courseResponseExample = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  title: 'Introduccion a NestJS',
  description: 'Curso base para construir APIs con NestJS.',
  status: 'DRAFT',
  createdBy: '550e8400-e29b-41d4-a716-446655440000',
  companyId: '8c40e1e6-2ed0-4f16-94b9-9d1f0b6f3c10',
  createdAt: '2026-05-19T10:30:00.000Z',
  updatedAt: '2026-05-19T10:35:00.000Z',
};

const courseModuleResponseExample = {
  id: '550e8400-e29b-41d4-a716-446655440011',
  courseId: '550e8400-e29b-41d4-a716-446655440010',
  title: 'Fundamentos de controladores',
  description: 'Primer modulo del curso.',
  order: 1,
  videoUrl: 'https://example.com/videos/controladores',
  documentationUrl: 'https://docs.example.com/controladores',
  durationMin: 45,
  createdAt: '2026-05-19T10:30:00.000Z',
  updatedAt: '2026-05-19T10:35:00.000Z',
};

const meetingLinkResponseExample = {
  id: '550e8400-e29b-41d4-a716-446655440012',
  courseId: '550e8400-e29b-41d4-a716-446655440010',
  url: 'https://meet.google.com/xxx-xxxx-xxx',
  platform: 'GOOGLE_MEET',
  password: 'meet-password',
  notes: 'Sesion de preguntas y respuestas.',
  addedBy: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2026-05-19T10:30:00.000Z',
  updatedAt: '2026-05-19T10:35:00.000Z',
};

const unauthorizedExample = {
  statusCode: 401,
  message: 'Unauthorized',
  error: 'Unauthorized',
};
const forbiddenExample = {
  statusCode: 403,
  message: 'Forbidden',
  error: 'Forbidden',
};
const badRequestExample = {
  statusCode: 400,
  message: 'ID invalido: debe ser un UUID v4',
  error: 'Bad Request',
};

@ApiTags('Cursos')
@ApiBearerAuth()
@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear nuevo curso',
    description: 'Crea un nuevo curso (solo ADMIN o COMPANY)',
  })
  @ApiBody({
    type: CreateCourseDto,
    schema: { example: createCourseRequestExample },
  })
  @ApiResponse({
    status: 201,
    description: 'Curso creado',
    type: Course,
    schema: { example: courseResponseExample },
  })
  @ApiBadRequestResponse({
    description: 'Solicitud invalida.',
    example: badRequestExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para crear cursos.',
    example: forbiddenExample,
  })
  createCourse(
    @Req() request: AuthenticatedRequest,
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<Course> {
    return this.coursesService.createCourse(request.user, createCourseDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar cursos',
    description:
      'Obtiene cursos. Los usuarios TALENT solo verán cursos en estado published; otros roles pueden ver más según permisos. Use ?published=true para filtrar publicados.',
  })
  @ApiQuery({
    name: 'published',
    required: false,
    type: Boolean,
    description: 'Filtrar solo cursos publicados',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cursos',
    type: [Course],
    schema: { example: [courseResponseExample] },
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para listar cursos.',
    example: forbiddenExample,
  })
  findAllCourses(
    @Req() request: AuthenticatedRequest,
    @Query('published') published?: boolean,
  ): Promise<Course[]> {
    return this.coursesService.findAllCourses(request.user, published ?? false);
  }

  @Get('company/me')
  @ApiOperation({
    summary: 'Mis cursos como COMPANY',
    description: 'Obtiene todos los cursos de la empresa autenticada',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cursos de la empresa',
    type: [Course],
    schema: { example: [courseResponseExample] },
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para listar cursos de la empresa.',
    example: forbiddenExample,
  })
  findCoursesForCompany(
    @Req() request: AuthenticatedRequest,
    @Query('published') published?: boolean,
  ): Promise<Course[]> {
    return this.coursesService.findAllCourses(request.user, published ?? false);
  }

  @Get(':courseId')
  @ApiOperation({ summary: 'Obtener curso por ID' })
  @ApiParam({
    name: 'courseId',
    description: 'ID del curso',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiResponse({
    status: 200,
    description: 'Curso encontrado',
    type: Course,
    schema: { example: courseResponseExample },
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para ver este curso.',
    example: forbiddenExample,
  })
  findCourseById(
    @Req() request: AuthenticatedRequest,
    @Param('courseId', UUID_V4_PARAM_PIPE) courseId: string,
  ): Promise<Course> {
    return this.coursesService.findCourseById(courseId, request.user);
  }

  @Patch(':courseId')
  @ApiOperation({
    summary: 'Actualizar curso',
    description: 'Actualiza un curso (solo creador o ADMIN)',
  })
  @ApiParam({
    name: 'courseId',
    description: 'ID del curso',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiBody({
    type: UpdateCourseDto,
    schema: { example: updateCourseRequestExample },
  })
  @ApiResponse({
    status: 200,
    description: 'Curso actualizado',
    type: Course,
    schema: { example: courseResponseExample },
  })
  @ApiBadRequestResponse({
    description: 'Solicitud invalida.',
    example: badRequestExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para actualizar este curso.',
    example: forbiddenExample,
  })
  updateCourse(
    @Req() request: AuthenticatedRequest,
    @Param('courseId', UUID_V4_PARAM_PIPE) courseId: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<Course> {
    return this.coursesService.updateCourse(
      request.user,
      courseId,
      updateCourseDto,
    );
  }

  @Delete(':courseId')
  @ApiOperation({
    summary: 'Eliminar curso',
    description: 'Elimina un curso (solo creador o ADMIN)',
  })
  @ApiParam({
    name: 'courseId',
    description: 'ID del curso',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiResponse({ status: 200, description: 'Curso eliminado' })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para eliminar este curso.',
    example: forbiddenExample,
  })
  deleteCourse(
    @Req() request: AuthenticatedRequest,
    @Param('courseId', UUID_V4_PARAM_PIPE) courseId: string,
  ): Promise<void> {
    return this.coursesService.deleteCourse(request.user, courseId);
  }

  @Post(':courseId/approve')
  @ApiOperation({
    summary: 'Aprobar publicación de curso',
    description:
      'Permite a un ADMIN aprobar y publicar un curso en estado pending_review',
  })
  @ApiParam({
    name: 'courseId',
    description: 'ID del curso',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiResponse({
    status: 200,
    description: 'Curso aprobado y publicado',
    type: Course,
    schema: { example: courseResponseExample },
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para aprobar cursos.',
    example: forbiddenExample,
  })
  approveCourse(
    @Req() request: AuthenticatedRequest,
    @Param('courseId', UUID_V4_PARAM_PIPE) courseId: string,
  ): Promise<Course> {
    return this.coursesService.approveCourse(request.user, courseId);
  }

  @Post(':courseId/modules')
  @ApiOperation({
    summary: 'Agregar módulo a curso',
    description: 'Agrega un nuevo módulo al curso (solo creador o ADMIN)',
  })
  @ApiParam({
    name: 'courseId',
    description: 'ID del curso',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiBody({
    type: CreateCourseModuleDto,
    schema: { example: createModuleRequestExample },
  })
  @ApiResponse({
    status: 201,
    description: 'Módulo agregado',
    type: CourseModule,
    schema: { example: courseModuleResponseExample },
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para agregar modulos.',
    example: forbiddenExample,
  })
  addModuleToCourse(
    @Req() request: AuthenticatedRequest,
    @Param('courseId', UUID_V4_PARAM_PIPE) courseId: string,
    @Body() createCourseModuleDto: CreateCourseModuleDto,
  ): Promise<CourseModule> {
    return this.coursesService.addModuleToCourse(
      request.user,
      courseId,
      createCourseModuleDto,
    );
  }

  @Patch(':courseId/modules/:moduleId')
  @ApiOperation({
    summary: 'Actualizar módulo de curso',
    description:
      'Actualiza un módulo del curso, solo permitido para el creador del curso',
  })
  @ApiParam({
    name: 'courseId',
    description: 'ID del curso',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'ID del módulo',
    example: '550e8400-e29b-41d4-a716-446655440011',
  })
  @ApiBody({
    type: UpdateCourseModuleDto,
    schema: { example: createModuleRequestExample },
  })
  @ApiResponse({
    status: 200,
    description: 'Módulo actualizado',
    type: CourseModule,
    schema: { example: courseModuleResponseExample },
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para actualizar modulos.',
    example: forbiddenExample,
  })
  updateModuleInCourse(
    @Req() request: AuthenticatedRequest,
    @Param('courseId', UUID_V4_PARAM_PIPE) courseId: string,
    @Param('moduleId', UUID_V4_PARAM_PIPE) moduleId: string,
    @Body() updateCourseModuleDto: UpdateCourseModuleDto,
  ): Promise<CourseModule> {
    return this.coursesService.updateModuleInCourse(
      request.user,
      courseId,
      moduleId,
      updateCourseModuleDto,
    );
  }

  @Delete(':courseId/modules/:moduleId')
  @ApiOperation({
    summary: 'Eliminar módulo de curso',
    description: 'Elimina un módulo del curso (solo creador o ADMIN)',
  })
  @ApiParam({
    name: 'courseId',
    description: 'ID del curso',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'ID del módulo',
    example: '550e8400-e29b-41d4-a716-446655440011',
  })
  @ApiResponse({ status: 200, description: 'Módulo eliminado' })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para eliminar modulos.',
    example: forbiddenExample,
  })
  removeModuleFromCourse(
    @Req() request: AuthenticatedRequest,
    @Param('courseId', UUID_V4_PARAM_PIPE) courseId: string,
    @Param('moduleId', UUID_V4_PARAM_PIPE) moduleId: string,
  ): Promise<void> {
    return this.coursesService.removeModuleFromCourse(
      request.user,
      courseId,
      moduleId,
    );
  }

  @Post(':courseId/meeting-links')
  @ApiOperation({
    summary: 'Agregar link de reunión',
    description:
      'Agrega un link de Google Meet, Zoom, Teams, etc. (solo creador o ADMIN)',
  })
  @ApiParam({
    name: 'courseId',
    description: 'ID del curso',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiBody({
    type: AddMeetingLinkDto,
    schema: { example: addMeetingLinkRequestExample },
  })
  @ApiResponse({
    status: 201,
    description: 'Link de reunión agregado',
    type: MeetingLink,
    schema: { example: meetingLinkResponseExample },
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para agregar links de reunion.',
    example: forbiddenExample,
  })
  addMeetingLink(
    @Req() request: AuthenticatedRequest,
    @Param('courseId', UUID_V4_PARAM_PIPE) courseId: string,
    @Body() addMeetingLinkDto: AddMeetingLinkDto,
  ): Promise<MeetingLink> {
    return this.coursesService.addMeetingLink(
      request.user,
      courseId,
      addMeetingLinkDto,
    );
  }

  @Delete(':courseId/meeting-links/:meetingLinkId')
  @ApiOperation({
    summary: 'Eliminar link de reunión',
    description: 'Elimina un link de reunión (solo creador o ADMIN)',
  })
  @ApiParam({
    name: 'courseId',
    description: 'ID del curso',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiParam({
    name: 'meetingLinkId',
    description: 'ID del link',
    example: '550e8400-e29b-41d4-a716-446655440012',
  })
  @ApiResponse({ status: 200, description: 'Link eliminado' })
  @ApiUnauthorizedResponse({
    description: 'Token ausente o invalido.',
    example: unauthorizedExample,
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para eliminar links.',
    example: forbiddenExample,
  })
  removeMeetingLink(
    @Req() request: AuthenticatedRequest,
    @Param('courseId', UUID_V4_PARAM_PIPE) courseId: string,
    @Param('meetingLinkId', UUID_V4_PARAM_PIPE) meetingLinkId: string,
  ): Promise<void> {
    return this.coursesService.removeMeetingLink(
      request.user,
      courseId,
      meetingLinkId,
    );
  }
}
