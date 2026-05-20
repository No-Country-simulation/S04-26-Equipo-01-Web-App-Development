import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}

const buildDefaultCompanyName = (email: string): string => {
  const emailPrefix = email.split('@')[0] || 'empresa';
  const compactName = emailPrefix.replace(/[^a-zA-Z0-9\s_-]/g, '').trim();

  return compactName.length > 0 ? compactName : 'empresa';
};

@Injectable()
export class MarketplaceService {
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
    @InjectRepository(Skill)
    private readonly skillsCatalogRepository: Repository<Skill>,
  ) {}

  private normalizePipelineStatus(status: ApplicationStatus): ApplicationStatus {
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

  private getMatchedSkills(candidateSkills: string[], vacancySkillSet: Set<string>): string[] {
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
  ): PipelineCandidate {
    const normalizedSkills = this.getCandidateSkillNames(profile).map((skill) => skill.toLowerCase());

    return {
      id: profile.id,
      fullName: profile.fullName || 'Sin nombre',
      title: profile.headline || 'N/A',
      location: profile.location || 'N/A',
      skillsValidated: normalizedSkills,
      matchedSkills,
      matchCount: matchedSkills.length,
    };
  }

  private async getOwnedVacancy(userId: string, vacancyId: string): Promise<JobOpportunity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || user.role !== UserRole.COMPANY) {
      throw new ForbiddenException('Solo usuarios empresa pueden gestionar candidatos.');
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

  async createRecruiterSkill(
    userId: string,
    payload: CreateRecruiterSkillDto,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || user.role !== UserRole.COMPANY) {
      throw new ForbiddenException(
        'Solo usuarios empresa pueden crear skills para vacantes.',
      );
    }

    const normalizedName = payload.name.trim().toLowerCase();
    const normalizedCategory = (payload.category || 'technical').trim().toLowerCase();

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

    const talentProfiles = profiles.filter((profile) => profile.user?.role === UserRole.TALENT);

    const applications = await this.candidateApplicationRepository.find({
      where: { opportunityId: vacancyId },
      relations: ['profile', 'profile.user', 'profile.skills', 'profile.skills.skill', 'profile.cvDiagnostics'],
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

    const pushByStatus = (candidate: PipelineCandidate, status?: ApplicationStatus) => {
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

      const candidate = this.mapProfileToPipelineCandidate(profile, matchedSkills);
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

    const existingApplication = await this.candidateApplicationRepository.findOne({
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
      ![ApplicationStatus.CONTACTED, ApplicationStatus.FINALIST].includes(currentStatus)
    ) {
      throw new BadRequestException(
        'Solo candidatos seleccionados pueden pasar a finalista.',
      );
    }

    if (
      stage === 'ACCEPTED' &&
      ![ApplicationStatus.FINALIST, ApplicationStatus.HIRED].includes(currentStatus)
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

    const saved = await this.candidateApplicationRepository.save(applicationToSave);

    return {
      applicationId: saved.id,
      candidateId,
      vacancyId,
      status: stage,
      matchedSkills,
    };
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
      query.andWhere('p.headline ILIKE :title', { title: `%${filters.title}%` });
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

    if (!profile || !profile.cvDiagnostics || profile.cvDiagnostics.length === 0) {
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

    if (!profile || !profile.learningPaths || profile.learningPaths.length === 0) {
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
   * Por ahora retorna array vacío ya que Course no está directamente relacionado con LearningPath
   */
  async getCandidateCourses(candidateId: string) {
    // Esta es una estructura simplificada
    // En una aplicación real, habría que determinar la relación exacta entre LearningPath y Course
    return [];
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
