import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CoursesService } from './application/courses.service';
import { CoursesController } from './infrastructure/courses.controller';
import { Course } from './infrastructure/entities/course.entity';
import { CourseModule } from './infrastructure/entities/course-module.entity';
import { MeetingLink } from './infrastructure/entities/meeting-link.entity';
import { Company } from '../companies/infrastructure/entities/company.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Course, CourseModule, MeetingLink, Company]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [TypeOrmModule],
})
export class CoursesModule {}
