export const CourseStatus = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type CourseStatus = (typeof CourseStatus)[keyof typeof CourseStatus];

export const MeetingPlatform = {
  GOOGLE_MEET: 'google_meet',
  ZOOM: 'zoom',
  TEAMS: 'teams',
  OTHER: 'other',
} as const;

export type MeetingPlatform =
  (typeof MeetingPlatform)[keyof typeof MeetingPlatform];

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  videoUrl?: string;
  documentationUrl?: string;
  durationMin?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingLink {
  id: string;
  courseId: string;
  url: string;
  platform: MeetingPlatform;
  scheduledAt?: string | null;
  password?: string;
  notes?: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  status: CourseStatus;
  createdBy: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
  modules: CourseModule[];
  meetingLinks: MeetingLink[];
}

export interface CreateCourseDto {
  title: string;
  description?: string;
  status?: CourseStatus;
}

export interface UpdateCourseDto {
  title?: string;
  description?: string;
  status?: CourseStatus;
}

export interface CreateCourseModuleDto {
  title: string;
  description?: string;
  order: number;
  videoUrl?: string;
  documentationUrl?: string;
  durationMin?: number;
}

export interface UpdateCourseModuleDto {
  title?: string;
  description?: string;
  order?: number;
  videoUrl?: string;
  documentationUrl?: string;
  durationMin?: number;
}

export interface AddMeetingLinkDto {
  url: string;
  platform: MeetingPlatform;
  scheduledAt: string;
  password?: string;
  notes?: string;
}
