import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthTokenPayload } from '../../auth/domain/auth-token-payload.type';
import { UserRole } from '../../users/domain/user-role.enum';
import { CourseStatus } from '../domain/course-status.enum';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateCourseModuleDto } from './dto/create-course-module.dto';
import { UpdateCourseModuleDto } from './dto/update-course-module.dto';
import { AddMeetingLinkDto } from './dto/add-meeting-link.dto';
import { Course } from '../infrastructure/entities/course.entity';
import { CourseModule } from '../infrastructure/entities/course-module.entity';
import { MeetingLink } from '../infrastructure/entities/meeting-link.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    @InjectRepository(CourseModule)
    private readonly courseModulesRepository: Repository<CourseModule>,
    @InjectRepository(MeetingLink)
    private readonly meetingLinksRepository: Repository<MeetingLink>,
  ) {}

  async createCourse(
    authUser: AuthTokenPayload,
    createCourseDto: CreateCourseDto,
  ): Promise<Course> {
    this.validateManagementAccess(authUser);
    // Companies cannot publish directly; only ADMIN can set PUBLISHED
    if (authUser.role === UserRole.COMPANY) {
      if (createCourseDto.status === CourseStatus.PUBLISHED) {
        throw new ForbiddenException(
          'COMPANY users cannot publish courses directly; use pending_review to request publication',
        );
      }

      if (
        createCourseDto.status &&
        createCourseDto.status !== CourseStatus.DRAFT &&
        createCourseDto.status !== CourseStatus.PENDING_REVIEW
      ) {
        throw new ForbiddenException(
          'COMPANY users may only set course status to DRAFT or PENDING_REVIEW',
        );
      }
    }
    const course = this.coursesRepository.create({
      title: createCourseDto.title,
      description: createCourseDto.description,
      status: createCourseDto.status ?? CourseStatus.DRAFT,
      createdBy: authUser.userId,
      companyId:
        authUser.role === UserRole.COMPANY ? authUser.userId : undefined,
    });

    return this.coursesRepository.save(course);
  }

  async approveCourse(
    authUser: AuthTokenPayload,
    courseId: string,
  ): Promise<Course> {
    if (authUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can approve courses');
    }

    const course = await this.findCourseById(courseId, authUser);

    if (course.status !== CourseStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'Course must be in pending_review status to be approved',
      );
    }

    course.status = CourseStatus.PUBLISHED;

    return this.coursesRepository.save(course);
  }

  async findCourseById(
    courseId: string,
    authUser?: AuthTokenPayload,
  ): Promise<Course> {
    const course = await this.coursesRepository.findOne({
      where: { id: courseId },
      relations: {
        modules: true,
        meetingLinks: true,
      },
      order: {
        modules: {
          order: 'ASC',
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // If authUser provided, enforce visibility rules
    if (authUser) {
      if (authUser.role === UserRole.TALENT) {
        if (course.status !== CourseStatus.PUBLISHED) {
          throw new NotFoundException('Course not found');
        }
      } else if (authUser.role === UserRole.COMPANY) {
        const isCompanyOwner = course?.companyId === authUser.userId;
        const isCreator = course.createdBy === authUser.userId;
        if (!isCompanyOwner && !isCreator) {
          throw new NotFoundException('Course not found');
        }
      }
      // ADMIN can see any course
    }

    return course;
  }

  async findAllCourses(
    authUser: AuthTokenPayload,
    published: boolean = false,
  ): Promise<Course[]> {
    const queryOptions = {
      relations: {
        modules: true,
        meetingLinks: true,
      },
      order: {
        createdAt: 'DESC' as const,
        modules: { order: 'ASC' as const },
      },
    };

    const where = (() => {
      if (authUser.role === UserRole.COMPANY) {
        return published
          ? { companyId: authUser.userId, status: CourseStatus.PUBLISHED }
          : { companyId: authUser.userId };
      }
      if (authUser.role === UserRole.ADMIN) {
        return published ? { status: CourseStatus.PUBLISHED } : {};
      }
      // TALENT or unauthenticated users only see published courses
      return { status: CourseStatus.PUBLISHED };
    })();

    return this.coursesRepository.find({
      where,
      ...queryOptions,
    });
  }

  async updateCourse(
    authUser: AuthTokenPayload,
    courseId: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<Course> {
    this.validateManagementAccess(authUser);
    const course = await this.findCourseById(courseId, authUser);
    this.validateCourseOwnership(authUser, course);

    // Prevent COMPANY from setting status to PUBLISHED directly and require PENDING_REVIEW for publication requests
    if (authUser.role === UserRole.COMPANY) {
      if (
        updateCourseDto.status &&
        updateCourseDto.status !== CourseStatus.DRAFT &&
        updateCourseDto.status !== CourseStatus.PENDING_REVIEW
      ) {
        throw new ForbiddenException(
          'COMPANY users may only set status to DRAFT or PENDING_REVIEW. To request publication, use PENDING_REVIEW.',
        );
      }
    }

    if (updateCourseDto.title) {
      course.title = updateCourseDto.title;
    }
    if (
      updateCourseDto.description &&
      updateCourseDto.description.trim() !== ''
    ) {
      course.description = updateCourseDto.description;
    }
    if (updateCourseDto.status) {
      course.status = updateCourseDto.status;
    }

    return this.coursesRepository.save(course);
  }

  async deleteCourse(
    authUser: AuthTokenPayload,
    courseId: string,
  ): Promise<void> {
    this.validateManagementAccess(authUser);

    const course = await this.findCourseById(courseId, authUser);

    if (authUser.role === UserRole.COMPANY) {
      const isCreator = course.createdBy === authUser.userId;
      if (!isCreator) {
        throw new ForbiddenException(
          'You do not have permission to perform this action.',
        );
      }
    }

    // only the following users can proceed to "delete" (archive) the course: ADMIN (any) and COMPANY (if owner)
    course.status = CourseStatus.ARCHIVED;
    await this.coursesRepository.save(course);
  }

  async addModuleToCourse(
    authUser: AuthTokenPayload,
    courseId: string,
    createCourseModuleDto: CreateCourseModuleDto,
  ): Promise<CourseModule> {
    this.validateManagementAccess(authUser);
    const course = await this.findCourseById(courseId, authUser);
    this.validateCourseOwnership(authUser, course);

    const module = this.courseModulesRepository.create({
      courseId,
      title: createCourseModuleDto.title,
      description: createCourseModuleDto.description,
      order: createCourseModuleDto.order,
      videoUrl: createCourseModuleDto.videoUrl,
      documentationUrl: createCourseModuleDto.documentationUrl,
      durationMin: createCourseModuleDto.durationMin,
    });

    return this.courseModulesRepository.save(module);
  }

  async updateModuleInCourse(
    authUser: AuthTokenPayload,
    courseId: string,
    moduleId: string,
    updateCourseModuleDto: UpdateCourseModuleDto,
  ): Promise<CourseModule> {
    const course = await this.findCourseById(courseId, authUser);
    this.validateManagementAccess(authUser);
    this.validateCourseCreator(authUser, course);

    const module = await this.courseModulesRepository.findOne({
      where: { id: moduleId, courseId },
    });

    if (!module) {
      throw new NotFoundException('Module not found in this course');
    }

    if (
      updateCourseModuleDto.title &&
      updateCourseModuleDto.title.trim() !== ''
    ) {
      module.title = updateCourseModuleDto.title;
    }
    if (updateCourseModuleDto.description !== undefined) {
      module.description = updateCourseModuleDto.description;
    }
    if (updateCourseModuleDto.order !== undefined) {
      module.order = updateCourseModuleDto.order;
    }
    if (updateCourseModuleDto.videoUrl !== undefined) {
      module.videoUrl = updateCourseModuleDto.videoUrl;
    }
    if (updateCourseModuleDto.documentationUrl !== undefined) {
      module.documentationUrl = updateCourseModuleDto.documentationUrl;
    }
    if (updateCourseModuleDto.durationMin !== undefined) {
      module.durationMin = updateCourseModuleDto.durationMin;
    }

    return this.courseModulesRepository.save(module);
  }

  async removeModuleFromCourse(
    authUser: AuthTokenPayload,
    courseId: string,
    moduleId: string,
  ): Promise<void> {
    this.validateManagementAccess(authUser);
    const course = await this.findCourseById(courseId, authUser);
    this.validateCourseOwnership(authUser, course);

    const module = await this.courseModulesRepository.findOne({
      where: { id: moduleId, courseId },
    });

    if (!module) {
      throw new NotFoundException('Module not found in this course');
    }

    await this.courseModulesRepository.remove(module);
  }

  async addMeetingLink(
    authUser: AuthTokenPayload,
    courseId: string,
    addMeetingLinkDto: AddMeetingLinkDto,
  ): Promise<MeetingLink> {
    this.validateManagementAccess(authUser);
    const course = await this.findCourseById(courseId, authUser);
    this.validateCourseOwnership(authUser, course);

    const meetingLink = this.meetingLinksRepository.create({
      courseId,
      url: addMeetingLinkDto.url,
      platform: addMeetingLinkDto.platform,
      scheduledAt: new Date(addMeetingLinkDto.scheduledAt),
      password: addMeetingLinkDto.password,
      notes: addMeetingLinkDto.notes,
      addedBy: authUser.userId,
    });

    return this.meetingLinksRepository.save(meetingLink);
  }

  async removeMeetingLink(
    authUser: AuthTokenPayload,
    courseId: string,
    meetingLinkId: string,
  ): Promise<void> {
    this.validateManagementAccess(authUser);
    const course = await this.findCourseById(courseId, authUser);
    this.validateCourseOwnership(authUser, course);

    const meetingLink = await this.meetingLinksRepository.findOne({
      where: { id: meetingLinkId, courseId },
    });

    if (!meetingLink) {
      throw new NotFoundException('Meeting link not found in this course');
    }

    await this.meetingLinksRepository.remove(meetingLink);
  }

  private validateManagementAccess(
    authUser: AuthTokenPayload,
    message: string = 'You do not have permission to perform this action.',
  ): void {
    if (
      authUser.role !== UserRole.ADMIN &&
      authUser.role !== UserRole.COMPANY
    ) {
      throw new ForbiddenException(message);
    }
  }

  private validateCourseOwnership(
    authUser: AuthTokenPayload,
    course: Course,
  ): void {
    const role = authUser.role;
    const isCreator = course.createdBy === authUser.userId;
    const baseMessage = 'You do not have permission to modify this course';

    this.validateManagementAccess(authUser, baseMessage);

    if (role === UserRole.COMPANY) {
      if (!isCreator) {
        throw new ForbiddenException(baseMessage);
      }
      return;
    }

    if (role === UserRole.ADMIN) {
      if (isCreator) return;
      const isOwnedByCompany = Boolean(course.companyId);
      if (isOwnedByCompany) {
        throw new ForbiddenException(
          'ADMIN users cannot modify courses created by a COMPANY',
        );
      }
      return;
    }

    // If new roles are added in the future, deny by default
    throw new ForbiddenException(baseMessage);
  }

  private validateCourseCreator(
    authUser: AuthTokenPayload,
    course: Course,
  ): void {
    if (course.createdBy !== authUser.userId) {
      throw new ForbiddenException(
        'Only the course creator can modify its modules',
      );
    }
  }
}
