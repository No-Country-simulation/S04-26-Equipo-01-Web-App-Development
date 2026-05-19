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
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
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
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({ status: 201, description: 'Curso creado', type: Course })
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
  })
  findAllCourses(
    @Req() request: AuthenticatedRequest,
    @Query('published') published?: boolean,
  ): Promise<Course[]> {
    return this.coursesService.findAllCourses(request.user, published ?? false);
  }

  @Get(':courseId')
  @ApiOperation({ summary: 'Obtener curso por ID' })
  @ApiParam({ name: 'courseId', description: 'ID del curso' })
  @ApiResponse({ status: 200, description: 'Curso encontrado', type: Course })
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
  @ApiParam({ name: 'courseId', description: 'ID del curso' })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({ status: 200, description: 'Curso actualizado', type: Course })
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
  @ApiParam({ name: 'courseId', description: 'ID del curso' })
  @ApiResponse({ status: 200, description: 'Curso eliminado' })
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
  @ApiParam({ name: 'courseId', description: 'ID del curso' })
  @ApiResponse({
    status: 200,
    description: 'Curso aprobado y publicado',
    type: Course,
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
  @ApiParam({ name: 'courseId', description: 'ID del curso' })
  @ApiBody({ type: CreateCourseModuleDto })
  @ApiResponse({
    status: 201,
    description: 'Módulo agregado',
    type: CourseModule,
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
  @ApiParam({ name: 'courseId', description: 'ID del curso' })
  @ApiParam({ name: 'moduleId', description: 'ID del módulo' })
  @ApiBody({ type: UpdateCourseModuleDto })
  @ApiResponse({
    status: 200,
    description: 'Módulo actualizado',
    type: CourseModule,
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
  @ApiParam({ name: 'courseId', description: 'ID del curso' })
  @ApiParam({ name: 'moduleId', description: 'ID del módulo' })
  @ApiResponse({ status: 200, description: 'Módulo eliminado' })
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
  @ApiParam({ name: 'courseId', description: 'ID del curso' })
  @ApiBody({ type: AddMeetingLinkDto })
  @ApiResponse({
    status: 201,
    description: 'Link de reunión agregado',
    type: MeetingLink,
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
  @ApiParam({ name: 'courseId', description: 'ID del curso' })
  @ApiParam({ name: 'meetingLinkId', description: 'ID del link' })
  @ApiResponse({ status: 200, description: 'Link eliminado' })
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
