import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Profile } from '../../profiles/infrastructure/entities/profile.entity';
import { UserSkill } from '../../skills/infrastructure/entities/user-skill.entity';
import { AssessmentTestResultEntity } from '../../assessment/infrastructure/entities/assessment-test-result.entity';
import { User } from '../../users/infrastructure/entities/user.entity';
import { UserRole } from '../../users/domain/user-role.enum';
import { Company } from '../../companies/infrastructure/entities/company.entity';
import { JobOpportunity } from '../infrastructure/entities/job-opportunity.entity';
import { CreateVacancyDto } from '../application/dto/create-vacancy.dto';
import { Skill } from '../../skills/infrastructure/entities/skill.entity';
import { CreateRecruiterSkillDto } from '../application/dto/create-recruiter-skill.dto';
import { CandidateApplication } from '../infrastructure/entities/candidate-application.entity';
import { ApplicationStatus } from './application-status.enum';
import { LearningPath } from '../../learning/infrastructure/entities/learning-path.entity';
import { ModuleStatus } from '../../learning/domain/module-status.enum';
import { CourseModule } from '../../courses/infrastructure/entities/course-module.entity';
import { CompanyFeedback } from '../infrastructure/entities/company-feedback.entity';
import { UpsertCandidateFeedbackDto } from '../application/dto/upsert-candidate-feedback.dto';
import { MailService } from '../../mail/application/mail.service';

interface CandidateFilters {
  name?: string;
  title?: string;
  skill?: string;
  minScore?: number;
  status?: string;
}

type PipelineStage = 'SELECTED' | 'FINALIST' | 'ACCEPTED';

export interface PipelineCandidate {
  id: string;
  fullName: string;
  title: string;
  location: string;
  skillsValidated: string[];
  matchedSkills: string[];
  matchCount: number;
  feedback?: string | null;
}

const buildDefaultCompanyName = (email: string): string => {
  const emailPrefix = email.split('@')[0] || 'empresa';
  const compactName = emailPrefix.replace(/[^a-zA-Z0-9\s_-]/g, '').trim();

  return compactName.length > 0 ? compactName : 'empresa';
};

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(UserSkill)
    private skillRepository: Repository<UserSkill>,
    @InjectRepository(AssessmentTestResultEntity)
    private assessmentTestResultRepository: Repository<AssessmentTestResultEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(JobOpportunity)
    private jobOpportunityRepository: Repository<JobOpportunity>,
    @InjectRepository(CandidateApplication)
    private candidateApplicationRepository: Repository<CandidateApplication>,
    @InjectRepository(CompanyFeedback)
    private companyFeedbackRepository: Repository<CompanyFeedback>,
    @InjectRepository(Skill)
    private readonly skillsCatalogRepository: Repository<Skill>,
    @InjectRepository(LearningPath)
    private readonly learningPathRepository: Repository<LearningPath>,
    @InjectRepository(CourseModule)
    private readonly courseModuleRepository: Repository<CourseModule>,
    private readonly mailService: MailService,
  ) {}

  private parseCourseReferences(contentUrl?: string): {
    courseId?: string;
    courseModuleId?: string;
  } {
    if (!contentUrl || contentUrl.trim() === '') {
      return {};
    }

    const uuidPattern =
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

    const lowerContent = contentUrl.toLowerCase();
    const allUuids = contentUrl.match(uuidPattern) || [];

    let courseId: string | undefined;
    let courseModuleId: string | undefined;

    const courseMatch = lowerContent.match(/courses\/([0-9a-f-]{36})/i);
    if (courseMatch?.[1]) {
      courseId = courseMatch[1];
    }

    const moduleMatch = lowerContent.match(/modules\/([0-9a-f-]{36})/i);
    if (moduleMatch?.[1]) {
      courseModuleId = moduleMatch[1];
    }

    if (!courseId) {
      const explicitCourseId = lowerContent.match(/courseid=([0-9a-f-]{36})/i);
      if (explicitCourseId?.[1]) {
        courseId = explicitCourseId[1];
      }
    }

    if (!courseModuleId) {
      const explicitModuleId = lowerContent.match(/moduleid=([0-9a-f-]{36})/i);
      if (explicitModuleId?.[1]) {
        courseModuleId = explicitModuleId[1];
      }
    }

    if (!courseId && allUuids.length > 0) {
      courseId = allUuids[0];
    }

    if (!courseModuleId && allUuids.length > 1) {
      courseModuleId = allUuids[1];
    }

    return {
      courseId,
      courseModuleId,
    };
  }

  private normalizePipelineStatus(
    status: ApplicationStatus,
  ): ApplicationStatus {
    if (status === ApplicationStatus.CONTACTED) {
      return ApplicationStatus.CONTACTED;
    }

    if (status === ApplicationStatus.HIRED) {
      return ApplicationStatus.HIRED;
    }

    return status;
  }

  private mapStageToApplicationStatus(stage: PipelineStage): ApplicationStatus {
    if (stage === 'SELECTED') {
      return ApplicationStatus.CONTACTED;
    }

    if (stage === 'FINALIST') {
      return ApplicationStatus.FINALIST;
    }

    return ApplicationStatus.HIRED;
  }

  private getCandidateSkillNames(profile: Profile): string[] {
    const skillsFromProfile = (profile.skills || [])
      .map((userSkill) => userSkill.skill?.name)
      .filter((name): name is string => Boolean(name && name.trim()));

    const latestDiagnostic = (profile.cvDiagnostics || []).reduce<
      Profile['cvDiagnostics'][number] | null
    >((latest, current) => {
      if (!latest) return current;
      return new Date(current.createdAt) > new Date(latest.createdAt)
        ? current
        : latest;
    }, null);

    const skillsFromCv = latestDiagnostic
      ? [
          ...(latestDiagnostic.technicalSkills || []),
          ...(latestDiagnostic.personalSkills || []),
        ]
      : [];

    return Array.from(
      new Set(
        [...skillsFromProfile, ...skillsFromCv]
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 0),
      ),
    );
  }

  private getVacancySkillSet(vacancy: JobOpportunity): Set<string> {
    const requiredSkills = Array.isArray(vacancy.requiredSkills?.items)
      ? (vacancy.requiredSkills.items as string[])
      : [];

    return new Set(
      requiredSkills
        .map((skill) => skill.trim().toLowerCase())
        .filter((skill) => skill.length > 0),
    );
  }

  private getMatchedSkills(
    candidateSkills: string[],
    vacancySkillSet: Set<string>,
  ): string[] {
    if (vacancySkillSet.size === 0) return [];

    return Array.from(
      new Set(
        candidateSkills
          .map((skill) => skill.trim().toLowerCase())
          .filter((skill) => skill.length > 0),
      ),
    ).filter((skill) => vacancySkillSet.has(skill));
  }

  private mapProfileToPipelineCandidate(
    profile: Profile,
    matchedSkills: string[],
    feedback?: string | null,
  ): PipelineCandidate {
    const normalizedSkills = this.getCandidateSkillNames(profile).map((skill) =>
      skill.toLowerCase(),
    );

    return {
      id: profile.id,
      fullName: profile.fullName || 'Sin nombre',
      title: profile.headline || 'N/A',
      location: profile.location || 'N/A',
      skillsValidated: normalizedSkills,
      matchedSkills,
      matchCount: matchedSkills.length,
      feedback: feedback || null,
    };
  }

  private async getOwnedVacancy(
    userId: string,
    vacancyId: string,
  ): Promise<JobOpportunity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || user.role !== UserRole.COMPANY) {
      throw new ForbiddenException(
        'Solo usuarios empresa pueden gestionar candidatos.',
      );
    }

    const company = await this.ensureCompanyForUser(user);

    const vacancy = await this.jobOpportunityRepository.findOne({
      where: { id: vacancyId, companyId: company.id },
    });

    if (!vacancy) {
      throw new NotFoundException('Vacante no encontrada para esta empresa.');
    }

    return vacancy;
  }

  private async ensureCompanyForUser(user: User): Promise<Company> {
    const existingCompany = await this.companyRepository.findOne({
      where: { userId: user.id },
    });

    if (existingCompany) {
      return existingCompany;
    }

    const createdCompany = this.companyRepository.create({
      userId: user.id,
      name: buildDefaultCompanyName(user.email),
    });

    return this.companyRepository.save(createdCompany);
  }

  async getAvailableSkills() {
    const skills = await this.skillsCatalogRepository.find({
      order: { name: 'ASC' },
    });

    return skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
    }));
  }

  async createRecruiterSkill(userId: string, payload: CreateRecruiterSkillDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || user.role !== UserRole.COMPANY) {
      throw new ForbiddenException(
        'Solo usuarios empresa pueden crear skills para vacantes.',
      );
    }

    const normalizedName = payload.name.trim().toLowerCase();
    const normalizedCategory = (payload.category || 'technical')
      .trim()
      .toLowerCase();

    const existing = await this.skillsCatalogRepository.findOne({
      where: { name: normalizedName },
    });

    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        category: existing.category,
        created: false,
      };
    }

    const created = await this.skillsCatalogRepository.save(
      this.skillsCatalogRepository.create({
        name: normalizedName,
        category: normalizedCategory,
      }),
    );

    return {
      id: created.id,
      name: created.name,
      category: created.category,
      created: true,
    };
  }

  async createVacancy(userId: string, payload: CreateVacancyDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || user.role !== UserRole.COMPANY) {
      throw new ForbiddenException(
        'Solo usuarios empresa pueden crear vacantes.',
      );
    }

    const company = await this.ensureCompanyForUser(user);

    const vacancy = this.jobOpportunityRepository.create({
      companyId: company.id,
      title: payload.title,
      description: payload.description,
      requiredSkills:
        payload.requiredSkills && payload.requiredSkills.length > 0
          ? { items: payload.requiredSkills }
          : undefined,
      location: payload.location,
      modality: payload.modality,
      vacancies: payload.vacancies ?? 1,
    });

    const savedVacancy = await this.jobOpportunityRepository.save(vacancy);

    await this.notifyVacancyCreated(savedVacancy.title, user.email, company.name);
    await this.notifyTalentsNewVacancy(savedVacancy.title, company.name, user.id);

    return {
      id: savedVacancy.id,
      companyId: savedVacancy.companyId,
      title: savedVacancy.title,
      description: savedVacancy.description,
      requiredSkills: payload.requiredSkills ?? [],
      location: savedVacancy.location,
      modality: savedVacancy.modality,
      vacancies: savedVacancy.vacancies,
      createdAt: savedVacancy.createdAt,
    };
  }

  async getMyVacancies(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || user.role !== UserRole.COMPANY) {
      throw new ForbiddenException(
        'Solo usuarios empresa pueden consultar vacantes.',
      );
    }

    const company = await this.ensureCompanyForUser(user);

    const vacancies = await this.jobOpportunityRepository.find({
      where: { companyId: company.id },
      order: { createdAt: 'DESC' },
    });

    return vacancies.map((vacancy) => ({
      id: vacancy.id,
      companyId: vacancy.companyId,
      title: vacancy.title,
      description: vacancy.description,
      requiredSkills: Array.isArray(vacancy.requiredSkills?.items)
        ? (vacancy.requiredSkills.items as string[])
        : [],
      location: vacancy.location,
      modality: vacancy.modality,
      vacancies: vacancy.vacancies,
      createdAt: vacancy.createdAt,
    }));
  }

  async getVacancyPipeline(userId: string, vacancyId: string) {
    const vacancy = await this.getOwnedVacancy(userId, vacancyId);
    const vacancySkillSet = this.getVacancySkillSet(vacancy);

    const profiles = await this.profileRepository.find({
      relations: ['user', 'skills', 'skills.skill', 'cvDiagnostics'],
    });

    const talentProfiles = profiles.filter(
      (profile) => profile.user?.role === UserRole.TALENT,
    );

    const applications = await this.candidateApplicationRepository.find({
      where: { opportunityId: vacancyId },
      relations: [
        'profile',
        'profile.user',
        'profile.skills',
        'profile.skills.skill',
        'profile.cvDiagnostics',
        'feedback',
      ],
      order: { createdAt: 'ASC' },
    });

    const applicationByProfileId = new Map<string, CandidateApplication>();
    applications.forEach((application) => {
      if (!applicationByProfileId.has(application.profileId)) {
        applicationByProfileId.set(application.profileId, application);
      }
    });

    const preselected: PipelineCandidate[] = [];
    const selected: PipelineCandidate[] = [];
    const finalists: PipelineCandidate[] = [];
    const accepted: PipelineCandidate[] = [];

    const pushByStatus = (
      candidate: PipelineCandidate,
      status?: ApplicationStatus,
    ) => {
      const normalizedStatus = status
        ? this.normalizePipelineStatus(status)
        : ApplicationStatus.PRESELECTED;

      if (normalizedStatus === ApplicationStatus.CONTACTED) {
        selected.push(candidate);
        return;
      }

      if (normalizedStatus === ApplicationStatus.FINALIST) {
        finalists.push(candidate);
        return;
      }

      if (normalizedStatus === ApplicationStatus.HIRED) {
        accepted.push(candidate);
        return;
      }

      preselected.push(candidate);
    };

    talentProfiles.forEach((profile) => {
      const matchedSkills = this.getMatchedSkills(
        this.getCandidateSkillNames(profile),
        vacancySkillSet,
      );

      const application = applicationByProfileId.get(profile.id);
      if (matchedSkills.length === 0 && !application) {
        return;
      }

      const candidate = this.mapProfileToPipelineCandidate(
        profile,
        matchedSkills,
        application?.feedback?.comments || null,
      );
      pushByStatus(candidate, application?.status);
    });

    return {
      vacancyId: vacancy.id,
      vacancyTitle: vacancy.title,
      vacanciesLimit: vacancy.vacancies ?? 1,
      preselected,
      selected,
      finalists,
      accepted,
    };
  }

  async moveCandidateToPipelineStage(
    userId: string,
    vacancyId: string,
    candidateId: string,
    stage: PipelineStage,
  ) {
    const vacancy = await this.getOwnedVacancy(userId, vacancyId);
    const vacancySkillSet = this.getVacancySkillSet(vacancy);

    const candidateProfile = await this.profileRepository.findOne({
      where: { id: candidateId },
      relations: ['user', 'skills', 'skills.skill', 'cvDiagnostics'],
    });

    if (!candidateProfile || candidateProfile.user?.role !== UserRole.TALENT) {
      throw new NotFoundException('Candidato no encontrado.');
    }

    const matchedSkills = this.getMatchedSkills(
      this.getCandidateSkillNames(candidateProfile),
      vacancySkillSet,
    );

    if (matchedSkills.length === 0) {
      throw new BadRequestException(
        'El candidato no hace match con las skills requeridas de la vacante.',
      );
    }

    const existingApplication =
      await this.candidateApplicationRepository.findOne({
        where: {
          profileId: candidateId,
          opportunityId: vacancyId,
        },
        order: { createdAt: 'ASC' },
      });

    const targetStatus = this.mapStageToApplicationStatus(stage);

    const currentStatus = existingApplication
      ? this.normalizePipelineStatus(existingApplication.status)
      : ApplicationStatus.PRESELECTED;

    if (!existingApplication && stage !== 'SELECTED') {
      throw new BadRequestException(
        'Primero debes seleccionar al candidato antes de pasarlo a finalista o aceptado.',
      );
    }

    if (
      stage === 'FINALIST' &&
      ![ApplicationStatus.CONTACTED, ApplicationStatus.FINALIST].includes(
        currentStatus,
      )
    ) {
      throw new BadRequestException(
        'Solo candidatos seleccionados pueden pasar a finalista.',
      );
    }

    if (
      stage === 'ACCEPTED' &&
      ![ApplicationStatus.FINALIST, ApplicationStatus.HIRED].includes(
        currentStatus,
      )
    ) {
      throw new BadRequestException(
        'Solo candidatos finalistas pueden ser aceptados.',
      );
    }

    if (stage === 'ACCEPTED' && currentStatus !== ApplicationStatus.HIRED) {
      const alreadyAccepted = await this.candidateApplicationRepository.count({
        where: {
          opportunityId: vacancyId,
          status: ApplicationStatus.HIRED,
        },
      });

      const vacanciesLimit = vacancy.vacancies ?? 1;
      if (alreadyAccepted >= vacanciesLimit) {
        throw new BadRequestException(
          `No puedes aceptar más candidatos que vacantes disponibles (${vacanciesLimit}).`,
        );
      }
    }

    const applicationToSave = existingApplication
      ? {
          ...existingApplication,
          status: targetStatus,
          matchScore: matchedSkills.length,
        }
      : this.candidateApplicationRepository.create({
          profileId: candidateId,
          opportunityId: vacancyId,
          status: targetStatus,
          matchScore: matchedSkills.length,
        });

    const saved =
      await this.candidateApplicationRepository.save(applicationToSave);

    if (candidateProfile.user?.email) {
      await this.notifyTalentStageUpdate(
        candidateProfile.user.email,
        vacancy.title,
        stage,
      );
    }

    return {
      applicationId: saved.id,
      candidateId,
      vacancyId,
      status: stage,
      matchedSkills,
    };
  }

  private async notifyVacancyCreated(
    vacancyTitle: string,
    companyEmail: string,
    companyName: string,
  ): Promise<void> {
    try {
      await this.mailService.sendVacancyCreatedNotification({
        to: companyEmail,
        vacancyTitle,
        companyName,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown mail error';
      this.logger.warn(
        `Unable to send vacancy-created email to ${companyEmail}: ${message}`,
      );
    }
  }

  private async notifyTalentsNewVacancy(
    vacancyTitle: string,
    companyName: string,
    companyUserId: string,
  ): Promise<void> {
    const talents = await this.userRepository.find({
      where: { role: UserRole.TALENT },
      select: { id: true, email: true },
    });

    for (const talent of talents) {
      if (!talent.email || talent.id === companyUserId) {
        continue;
      }

      try {
        await this.mailService.sendTalentVacancyAvailableNotification({
          to: talent.email,
          vacancyTitle,
          companyName,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'unknown mail error';
        this.logger.warn(
          `Unable to send new-vacancy email to ${talent.email}: ${message}`,
        );
      }
    }
  }

  private async notifyTalentStageUpdate(
    talentEmail: string,
    vacancyTitle: string,
    stage: PipelineStage,
  ): Promise<void> {
    const stageMap: Record<PipelineStage, 'PREAPROBADO' | 'APROBADO' | 'SELECCIONADO'> = {
      SELECTED: 'PREAPROBADO',
      FINALIST: 'APROBADO',
      ACCEPTED: 'SELECCIONADO',
    };

    try {
      await this.mailService.sendTalentPipelineUpdateNotification({
        to: talentEmail,
        vacancyTitle,
        stage: stageMap[stage],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown mail error';
      this.logger.warn(
        `Unable to send stage-update email to ${talentEmail}: ${message}`,
      );
    }
  }

  async upsertCandidateFeedback(
    userId: string,
    vacancyId: string,
    candidateId: string,
    payload: UpsertCandidateFeedbackDto,
  ) {
    await this.getOwnedVacancy(userId, vacancyId);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.COMPANY) {
      throw new ForbiddenException(
        'Solo usuarios empresa pueden guardar feedback de candidatos.',
      );
    }

    const company = await this.ensureCompanyForUser(user);

    const application = await this.candidateApplicationRepository.findOne({
      where: {
        profileId: candidateId,
        opportunityId: vacancyId,
      },
      relations: ['feedback'],
    });

    if (!application) {
      throw new NotFoundException(
        'No existe una postulacion para este candidato en la vacante indicada.',
      );
    }

    const normalizedStatus = this.normalizePipelineStatus(application.status);
    if (
      ![
        ApplicationStatus.CONTACTED,
        ApplicationStatus.FINALIST,
        ApplicationStatus.HIRED,
      ].includes(normalizedStatus)
    ) {
      throw new BadRequestException(
        'Solo puedes registrar feedback para candidatos seleccionados, finalistas o aceptados.',
      );
    }

    const existingFeedback = application.feedback
      ? application.feedback
      : await this.companyFeedbackRepository.findOne({
          where: { applicationId: application.id },
        });

    const feedback = existingFeedback
      ? {
          ...existingFeedback,
          comments: payload.feedback.trim(),
          companyId: company.id,
          applicationId: application.id,
        }
      : this.companyFeedbackRepository.create({
          companyId: company.id,
          applicationId: application.id,
          comments: payload.feedback.trim(),
        });

    const savedFeedback = await this.companyFeedbackRepository.save(feedback);

    return {
      id: savedFeedback.id,
      vacancyId,
      candidateId,
      feedback: savedFeedback.comments || '',
      createdAt: savedFeedback.createdAt,
    };
  }

  async getMyTalentFeedback(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || user.role !== UserRole.TALENT) {
      throw new ForbiddenException(
        'Solo usuarios talento pueden consultar su feedback de postulaciones.',
      );
    }

    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      return [];
    }

    const applications = await this.candidateApplicationRepository.find({
      where: { profileId: profile.id },
      relations: ['opportunity', 'feedback'],
      order: { createdAt: 'DESC' },
    });

    return applications
      .filter((application) => {
        const normalizedStatus = this.normalizePipelineStatus(application.status);
        return (
          [
            ApplicationStatus.CONTACTED,
            ApplicationStatus.FINALIST,
            ApplicationStatus.HIRED,
          ].includes(normalizedStatus) &&
          Boolean(application.feedback?.comments?.trim())
        );
      })
      .map((application) => ({
        applicationId: application.id,
        vacancyId: application.opportunityId,
        vacancyTitle: application.opportunity?.title || 'Vacante',
        stage: this.normalizePipelineStatus(application.status),
        feedback: application.feedback?.comments || '',
        createdAt: application.feedback?.createdAt || application.createdAt,
      }));
  }

  /**
   * Obtiene lista de candidatos (talentos) con filtros opcionales
   */
  async getCandidates(filters: CandidateFilters) {
    const query = this.profileRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'u')
      .leftJoinAndSelect('p.skills', 'userSkills')
      .leftJoinAndSelect('userSkills.skill', 'catalogSkill')
      .leftJoinAndSelect('p.cvDiagnostics', 'cvDiagnostics')
      .where('u.role = :role', { role: UserRole.TALENT });

    if (filters.name) {
      query.andWhere('p.fullName ILIKE :name', { name: `%${filters.name}%` });
    }

    if (filters.title) {
      query.andWhere('p.headline ILIKE :title', {
        title: `%${filters.title}%`,
      });
    }

    if (filters.skill) {
      query.andWhere('catalogSkill.name ILIKE :skill', {
        skill: `%${filters.skill}%`,
      });
    }

    if (filters.minScore !== undefined) {
      query.andWhere('p.employabilityScore >= :minScore', {
        minScore: filters.minScore,
      });
    }

    const profiles = await query.getMany();

    return profiles.map((profile) => {
      const skillsFromProfile = (profile.skills || [])
        .map((userSkill) => userSkill.skill?.name)
        .filter((name): name is string => Boolean(name && name.trim()));

      const latestDiagnostic = (profile.cvDiagnostics || []).reduce<
        Profile['cvDiagnostics'][number] | null
      >((latest, current) => {
        if (!latest) return current;
        return new Date(current.createdAt) > new Date(latest.createdAt)
          ? current
          : latest;
      }, null);

      const skillsFromCv = latestDiagnostic
        ? [
            ...(latestDiagnostic.technicalSkills || []),
            ...(latestDiagnostic.personalSkills || []),
          ]
        : [];

      const mergedSkills = Array.from(
        new Set(
          [...skillsFromProfile, ...skillsFromCv]
            .map((skill) => skill.trim())
            .filter((skill) => skill.length > 0),
        ),
      );

      return {
        id: profile.id,
        name: profile.fullName,
        fullName: profile.fullName,
        title: profile.headline || 'N/A',
        headline: profile.headline,
        email: profile.user?.email || '',
        location: profile.location,
        summary: profile.professionalBio,
        employabilityScore: profile.employabilityScore,
        skills: mergedSkills.map((skill, index) => ({
          id: `${profile.id}-skill-${index}`,
          name: skill,
          category: 'general',
          level: 1,
        })),
      };
    });
  }

  /**
   * Obtiene detalles completos de un candidato específico
   */
  async getCandidateDetails(candidateId: string) {
    return this.profileRepository.findOne({
      where: { id: candidateId },
      relations: [
        'user',
        'skills',
        'assessments',
        'learningPaths',
        'cvDiagnostics',
      ],
    });
  }

  /**
   * Obtiene todas las skills de un candidato
   */
  async getCandidateSkills(candidateId: string) {
    const profile = await this.profileRepository.findOne({
      where: { id: candidateId },
      relations: ['skills'],
    });

    if (!profile) {
      return [];
    }

    return profile.skills || [];
  }

  /**
   * Obtiene información del CV de un candidato
   */
  async getCandidateCv(candidateId: string) {
    const profile = await this.profileRepository.findOne({
      where: { id: candidateId },
      relations: ['cvDiagnostics'],
    });

    if (
      !profile ||
      !profile.cvDiagnostics ||
      profile.cvDiagnostics.length === 0
    ) {
      return null;
    }

    // Retornar el diagnóstico más reciente
    const latest = profile.cvDiagnostics[profile.cvDiagnostics.length - 1];

    return {
      id: latest.id,
      fileName: latest.fileName || null,
      url: latest.fileName || null,
      uploadedAt: latest.createdAt,
      summary: latest.summary || null,
      technicalSkills: latest.technicalSkills || [],
      personalSkills: latest.personalSkills || [],
      snapshot: latest.snapshot || null,
      parsed: latest.aiAnalysis || null,
    };
  }

  /**
   * Obtiene resultados de evaluaciones (pruebas técnicas y psicotécnicas)
   */
  async getCandidateAssessmentResults(candidateId: string) {
    const results = await this.assessmentTestResultRepository.find({
      where: { profileId: candidateId },
      order: { createdAt: 'DESC' },
    });

    return results.map((result) => ({
      id: result.id,
      type: result.type,
      testName: result.title,
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      completedAt: result.createdAt,
      feedback: result.feedback,
      result: result.result,
    }));
  }

  /**
   * Obtiene la ruta de aprendizaje de un candidato
   */
  async getCandidateLearningPath(candidateId: string) {
    const profile = await this.profileRepository.findOne({
      where: { id: candidateId },
      relations: ['learningPaths'],
    });

    if (
      !profile ||
      !profile.learningPaths ||
      profile.learningPaths.length === 0
    ) {
      return null;
    }

    const path = profile.learningPaths[0];

    return {
      id: path.id,
      title: path.title,
      objective: path.objective,
      aiGenerated: path.aiGenerated,
    };
  }

  /**
   * Obtiene los cursos de un candidato
   * Se construyen a partir de la ruta de aprendizaje del talento.
   * "Visto" = al menos un modulo en progreso/completado.
   * "Aprobado" = todos los modulos completados.
   */
  async getCandidateCourses(candidateId: string) {
    const learningPaths = await this.learningPathRepository.find({
      where: { profileId: candidateId },
      relations: {
        modules: {
          progress: true,
        },
      },
      order: {
        createdAt: 'DESC',
        modules: {
          order: 'ASC',
        },
      },
    });

    const moduleReferences = learningPaths.flatMap((path) =>
      (path.modules || []).map((module) => ({
        pathId: path.id,
        pathTitle: path.title,
        module,
        refs: this.parseCourseReferences(module.contentUrl),
      })),
    );

    const referencedModuleIds = Array.from(
      new Set(
        moduleReferences
          .map((entry) => entry.refs.courseModuleId)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const referencedCourseIds = Array.from(
      new Set(
        moduleReferences
          .map((entry) => entry.refs.courseId)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const linkedCourseModules =
      referencedModuleIds.length > 0
        ? await this.courseModuleRepository.find({
            where: { id: In(referencedModuleIds) },
            relations: {
              course: true,
            },
          })
        : [];

    const moduleById = new Map(
      linkedCourseModules.map((module) => [module.id, module]),
    );

    const linkedCoursesById = new Map<string, { id: string; title: string }>();
    linkedCourseModules.forEach((module) => {
      if (module.course?.id) {
        linkedCoursesById.set(module.course.id, {
          id: module.course.id,
          title: module.course.title,
        });
      }
    });

    referencedCourseIds.forEach((courseId) => {
      if (!linkedCoursesById.has(courseId)) {
        linkedCoursesById.set(courseId, {
          id: courseId,
          title: 'Curso de academia',
        });
      }
    });

    const linkedCourseStats = new Map<
      string,
      {
        id: string;
        title: string;
        modules: number;
        completedModules: number;
        viewedModules: number;
      }
    >();

    moduleReferences.forEach((entry) => {
      const progress = (entry.module.progress || []).find(
        (item) => item.profileId === candidateId,
      );

      const linkedModule = entry.refs.courseModuleId
        ? moduleById.get(entry.refs.courseModuleId)
        : undefined;

      const effectiveCourseId =
        linkedModule?.courseId || entry.refs.courseId || undefined;

      if (!effectiveCourseId) {
        return;
      }

      const courseData = linkedCoursesById.get(effectiveCourseId) || {
        id: effectiveCourseId,
        title: entry.pathTitle || 'Curso de academia',
      };

      const current = linkedCourseStats.get(effectiveCourseId) || {
        id: courseData.id,
        title: courseData.title,
        modules: 0,
        completedModules: 0,
        viewedModules: 0,
      };

      current.modules += 1;

      if (progress?.status === ModuleStatus.COMPLETED) {
        current.completedModules += 1;
        current.viewedModules += 1;
      } else if (progress?.status === ModuleStatus.IN_PROGRESS) {
        current.viewedModules += 1;
      }

      linkedCourseStats.set(effectiveCourseId, current);
    });

    const linkedCourses = Array.from(linkedCourseStats.values()).map(
      (course) => {
        const status =
          course.modules > 0 && course.completedModules === course.modules
            ? 'completed'
            : course.viewedModules > 0
              ? 'in_progress'
              : 'pending';

        const progress =
          course.modules > 0
            ? Math.round((course.completedModules / course.modules) * 100)
            : 0;

        return {
          id: course.id,
          title: course.title,
          description: '',
          status,
          progress,
          modules: course.modules,
          completedModules: course.completedModules,
        };
      },
    );

    const fallbackLearningPathCourses = learningPaths.map((path) => {
      const modules = path.modules || [];
      const totalModules = modules.length;

      let completedModules = 0;
      let viewedModules = 0;

      modules.forEach((module) => {
        const moduleProgress = (module.progress || []).find(
          (progress) => progress.profileId === candidateId,
        );

        if (!moduleProgress) {
          return;
        }

        if (moduleProgress.status === ModuleStatus.COMPLETED) {
          completedModules += 1;
          viewedModules += 1;
          return;
        }

        if (moduleProgress.status === ModuleStatus.IN_PROGRESS) {
          viewedModules += 1;
        }
      });

      const status =
        totalModules > 0 && completedModules === totalModules
          ? 'completed'
          : viewedModules > 0
            ? 'in_progress'
            : 'pending';

      const progress =
        totalModules > 0
          ? Math.round((completedModules / totalModules) * 100)
          : 0;

      return {
        id: path.id,
        title: path.title,
        description: path.objective || '',
        status,
        progress,
        modules: totalModules,
        completedModules,
      };
    });

    const linkedIds = new Set(linkedCourses.map((course) => course.id));

    return [
      ...linkedCourses,
      ...fallbackLearningPathCourses.filter(
        (course) => !linkedIds.has(course.id),
      ),
    ];
  }

  /**
   * Obtiene datos consolidados del candidato para evitar múltiples requests
   */
  async getCandidateConsolidatedData(candidateId: string) {
    const [profile, skills, cv, assessmentResults, learningPath, courses] =
      await Promise.all([
        this.getCandidateDetails(candidateId),
        this.getCandidateSkills(candidateId),
        this.getCandidateCv(candidateId),
        this.getCandidateAssessmentResults(candidateId),
        this.getCandidateLearningPath(candidateId),
        this.getCandidateCourses(candidateId),
      ]);

    return {
      profile,
      skills,
      cv,
      assessmentResults,
      learningPath,
      courses,
    };
  }
}
