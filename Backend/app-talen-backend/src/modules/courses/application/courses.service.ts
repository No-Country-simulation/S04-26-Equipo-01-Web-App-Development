import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthTokenPayload } from '../../auth/domain/auth-token-payload.type';
import { Company } from '../../companies/infrastructure/entities/company.entity';
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
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
  ) {}

  async createCourse(
    authUser: AuthTokenPayload,
    createCourseDto: CreateCourseDto,
  ): Promise<Course> {
    this.validateAdminOrCompanyRole(authUser);
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
          'COMPANY users may only set status to DRAFT or PENDING_REVIEW',
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

    const course = await this.findCourseById(courseId);

    if (course.status !== CourseStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'Course must be in pending_review status to be approved',
      );
    }

    course.status = CourseStatus.PUBLISHED;

    return this.coursesRepository.save(course);
  }

  async findCourseById(courseId: string): Promise<Course> {
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

    return course;
  }

  async findAllCourses(published: boolean = false): Promise<Course[]> {
    const where = published ? { status: CourseStatus.PUBLISHED } : {};

    return this.coursesRepository.find({
      where,
      relations: {
        modules: true,
        meetingLinks: true,
      },
      order: {
        createdAt: 'DESC',
        modules: {
          order: 'ASC',
        },
      },
    });
  }

  async updateCourse(
    authUser: AuthTokenPayload,
    courseId: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<Course> {
    const course = await this.findCourseById(courseId);
    this.validateCourseOwnership(authUser, course);

    // Prevent COMPANY from setting status to PUBLISHED directly and require PENDING_REVIEW for publication requests
    if (authUser.role === UserRole.COMPANY) {
      if (updateCourseDto.status === CourseStatus.PUBLISHED) {
        throw new ForbiddenException(
          'COMPANY users cannot publish courses directly; use pending_review to request publication',
        );
      }

      if (
        updateCourseDto.status &&
        updateCourseDto.status !== CourseStatus.DRAFT &&
        updateCourseDto.status !== CourseStatus.PENDING_REVIEW
      ) {
        throw new ForbiddenException(
          'COMPANY users may only set status to DRAFT or PENDING_REVIEW',
        );
      }
    }

    if (updateCourseDto.title) {
      course.title = updateCourseDto.title;
    }
    if (updateCourseDto.description !== undefined) {
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
    const course = await this.findCourseById(courseId);
    this.validateCourseOwnership(authUser, course);

    await this.coursesRepository.remove(course);
  }

  async addModuleToCourse(
    authUser: AuthTokenPayload,
    courseId: string,
    createCourseModuleDto: CreateCourseModuleDto,
  ): Promise<CourseModule> {
    const course = await this.findCourseById(courseId);
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
    const course = await this.findCourseById(courseId);
    this.validateCourseCreator(authUser, course);

    const module = await this.courseModulesRepository.findOne({
      where: { id: moduleId, courseId },
    });

    if (!module) {
      throw new NotFoundException('Module not found in this course');
    }

    if (updateCourseModuleDto.title !== undefined) {
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
    const course = await this.findCourseById(courseId);
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
    const course = await this.findCourseById(courseId);
    this.validateCourseOwnership(authUser, course);

    const meetingLink = this.meetingLinksRepository.create({
      courseId,
      url: addMeetingLinkDto.url,
      platform: addMeetingLinkDto.platform,
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
    const course = await this.findCourseById(courseId);
    this.validateCourseOwnership(authUser, course);

    const meetingLink = await this.meetingLinksRepository.findOne({
      where: { id: meetingLinkId, courseId },
    });

    if (!meetingLink) {
      throw new NotFoundException('Meeting link not found in this course');
    }

    await this.meetingLinksRepository.remove(meetingLink);
  }

  async findCoursesForCompany(authUser: AuthTokenPayload): Promise<Course[]> {
    if (authUser.role !== UserRole.COMPANY) {
      throw new ForbiddenException('Only COMPANY users can access this');
    }

    return this.coursesRepository.find({
      where: { companyId: authUser.userId },
      relations: {
        modules: true,
        meetingLinks: true,
      },
      order: {
        createdAt: 'DESC',
        modules: {
          order: 'ASC',
        },
      },
    });
  }

  private validateAdminOrCompanyRole(authUser: AuthTokenPayload): void {
    if (
      authUser.role !== UserRole.ADMIN &&
      authUser.role !== UserRole.COMPANY
    ) {
      throw new ForbiddenException(
        'Only ADMIN or COMPANY users can manage courses',
      );
    }
  }

  private validateCourseOwnership(
    authUser: AuthTokenPayload,
    course: Course,
  ): void {
    const isAdmin = authUser.role === UserRole.ADMIN;
    const isCreator = course.createdBy === authUser.userId;
    const isCompanyOwner =
      course.companyId && course.companyId === authUser.userId;

    if (!isAdmin && !isCreator && !isCompanyOwner) {
      throw new ForbiddenException(
        'You do not have permission to modify this course',
      );
    }
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
