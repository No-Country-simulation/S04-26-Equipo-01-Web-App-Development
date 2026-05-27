import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PDFParse } from 'pdf-parse';
import { Repository } from 'typeorm';
import { AiCvService } from '../../ai/application/ai-cv.service';
import { AiCvAnalysis } from '../../ai/domain/ai-cv-analysis.type';
import { Assessment } from '../../assessment/infrastructure/entities/assessment.entity';
import { AuthTokenPayload } from '../../auth/domain/auth-token-payload.type';
import { UserModuleProgress } from '../../learning/infrastructure/entities/user-module-progress.entity';
import { SkillLevel } from '../../skills/domain/skill-level.enum';
import { UserSkill } from '../../skills/infrastructure/entities/user-skill.entity';
import { UserRole } from '../../users/domain/user-role.enum';
import { AssessmentLevel } from '../../assessment/domain/assessment-level.enum';
import { AnalyzeCvDto } from './dto/analyze-cv.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { ImportLinkedInCvDto } from './dto/import-linkedin-cv.dto';
import { UpdateInterestedRolesDto } from './dto/update-interested-roles.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateWorkPreferencesDto } from './dto/update-work-preferences.dto';
import { SaveCvDiagnosticDto } from './dto/save-cv-diagnostic.dto';
import { CvAnalysisResponse } from '../domain/cv-analysis-response.type';
import { LinkedInCvImportResponse } from '../domain/linkedin-cv-import-response.type';
import { UploadedCvFile } from '../domain/uploaded-cv-file.type';
import { InterestedRole } from '../domain/interested-role.enum';
import { WorkModality } from '../domain/work-modality.enum';
import { CvDiagnostic } from '../infrastructure/entities/cv-diagnostic.entity';
import { ProfileEducation } from '../infrastructure/entities/profile-education.entity';
import { ProfileExperience } from '../infrastructure/entities/profile-experience.entity';
import { Profile } from '../infrastructure/entities/profile.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
    @InjectRepository(CvDiagnostic)
    private readonly cvDiagnosticsRepository: Repository<CvDiagnostic>,
    @InjectRepository(ProfileExperience)
    private readonly profileExperiencesRepository: Repository<ProfileExperience>,
    @InjectRepository(ProfileEducation)
    private readonly profileEducationsRepository: Repository<ProfileEducation>,
    @InjectRepository(Assessment)
    private readonly assessmentsRepository: Repository<Assessment>,
    @InjectRepository(UserModuleProgress)
    private readonly progressRepository: Repository<UserModuleProgress>,
    @InjectRepository(UserSkill)
    private readonly userSkillsRepository: Repository<UserSkill>,
    private readonly aiCvService: AiCvService,
  ) {}

  async createMe(
    authUser: AuthTokenPayload,
    createProfileDto: CreateProfileDto,
  ): Promise<Profile> {
    this.ensureTalent(authUser);

    const existingProfile = await this.profilesRepository.findOne({
      where: { userId: authUser.userId },
    });

    if (existingProfile) {
      this.profilesRepository.merge(existingProfile, createProfileDto);
      return this.profilesRepository.save(existingProfile);
    }

    const profile = this.profilesRepository.create({
      ...createProfileDto,
      userId: authUser.userId,
    });

    return this.profilesRepository.save(profile);
  }

  async getMe(authUser: AuthTokenPayload): Promise<Profile> {
    this.ensureTalent(authUser);

    return this.findMyProfile(authUser.userId);
  }

  async updateMe(
    authUser: AuthTokenPayload,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    this.ensureTalent(authUser);

    const profile = await this.findMyProfile(authUser.userId);
    this.profilesRepository.merge(profile, updateProfileDto);

    return this.profilesRepository.save(profile);
  }

  async updateMyWorkPreferences(
    authUser: AuthTokenPayload,
    updateWorkPreferencesDto: UpdateWorkPreferencesDto,
  ): Promise<Profile> {
    this.ensureTalent(authUser);

    const profile = await this.findMyProfile(authUser.userId);
    this.profilesRepository.merge(profile, updateWorkPreferencesDto);

    return this.profilesRepository.save(profile);
  }

  async updateMyInterestedRoles(
    authUser: AuthTokenPayload,
    updateInterestedRolesDto: UpdateInterestedRolesDto,
  ): Promise<Profile> {
    this.ensureTalent(authUser);

    const profile = await this.findMyProfile(authUser.userId);
    profile.interestedRoles = updateInterestedRolesDto.interestedRoles;

    return this.profilesRepository.save(profile);
  }

  async recalculateMyEmployabilityScore(
    authUser: AuthTokenPayload,
  ): Promise<Profile> {
    this.ensureTalent(authUser);

    const profile = await this.findMyProfile(authUser.userId);
    const [assessment, progressRecords, userSkills] = await Promise.all([
      this.assessmentsRepository.findOne({
        where: { profileId: profile.id },
        order: { createdAt: 'DESC' },
      }),
      this.progressRepository.find({
        where: { profileId: profile.id },
      }),
      this.userSkillsRepository.find({
        where: { profileId: profile.id },
      }),
    ]);

    profile.employabilityScore = this.calculateEmployabilityScore(
      profile,
      Boolean(assessment),
      progressRecords,
      userSkills,
    );

    return this.profilesRepository.save(profile);
  }

  async analyzeMyCv(
    authUser: AuthTokenPayload,
    file: UploadedCvFile | undefined,
    analyzeCvDto: AnalyzeCvDto,
  ): Promise<CvAnalysisResponse> {
    this.ensureTalent(authUser);

    const cvText = await this.extractCvText(file, analyzeCvDto.extractedText);
    const aiAnalysis = await this.aiCvService.analyzeCv(cvText);
    const analysis = aiAnalysis ?? this.buildFallbackCvAnalysis(cvText);

    const appliedFields: string[] = [];
    let updatedProfile: Profile | undefined;

    if (analyzeCvDto.applyToProfile) {
      const profile = await this.findMyProfile(authUser.userId);

      appliedFields.push(...this.applyProfileSuggestions(profile, analysis));
      updatedProfile = await this.profilesRepository.save(profile);
    }

    const profile = await this.findMyProfile(authUser.userId);
    const normalizedTechnicalSkills = analysis.suggestedSkills
      .filter(
        (skill) => this.normalizeSkillCategory(skill.category) === 'technical',
      )
      .map((skill) => skill.name);
    const normalizedPersonalSkills = analysis.suggestedSkills
      .filter(
        (skill) => this.normalizeSkillCategory(skill.category) === 'personal',
      )
      .map((skill) => skill.name);

    const savedDiagnostic = await this.cvDiagnosticsRepository.save(
      this.cvDiagnosticsRepository.create({
        profileId: profile.id,
        fileName: file?.originalname,
        extractedTextLength: cvText.length,
        rawText: cvText,
        summary: analysis.summary,
        technicalSkills: normalizedTechnicalSkills,
        personalSkills: normalizedPersonalSkills,
        aiAnalysis: analysis as unknown as Record<string, unknown>,
      }),
    );

    return {
      ...analysis,
      fileName: file?.originalname,
      extractedTextLength: cvText.length,
      appliedFields,
      updatedProfile,
      diagnosticId: savedDiagnostic.id,
    };
  }

  async saveMyCvDiagnostic(
    authUser: AuthTokenPayload,
    saveCvDiagnosticDto: SaveCvDiagnosticDto,
  ): Promise<CvDiagnostic> {
    this.ensureTalent(authUser);

    const profile = await this.findMyProfile(authUser.userId);
    await this.replaceProfileCvSections(profile.id, saveCvDiagnosticDto);

    const rawText = saveCvDiagnosticDto.rawText?.trim() || undefined;
    const diagnostic = this.cvDiagnosticsRepository.create({
      profileId: profile.id,
      fileName: saveCvDiagnosticDto.fileName?.trim() || undefined,
      extractedTextLength: rawText ? rawText.length : 0,
      rawText,
      summary: saveCvDiagnosticDto.summary?.trim() || undefined,
      technicalSkills: saveCvDiagnosticDto.skills.technical,
      personalSkills: saveCvDiagnosticDto.skills.personal,
      snapshot: {
        profile: saveCvDiagnosticDto.profile,
        skills: saveCvDiagnosticDto.skills,
        experience: saveCvDiagnosticDto.experience ?? [],
        education: saveCvDiagnosticDto.education ?? [],
      },
      aiAnalysis: saveCvDiagnosticDto.aiAnalysis,
    });

    return this.cvDiagnosticsRepository.save(diagnostic);
  }

  async findMyCvDiagnostics(
    authUser: AuthTokenPayload,
  ): Promise<CvDiagnostic[]> {
    this.ensureTalent(authUser);

    const profile = await this.findMyProfile(authUser.userId);

    return this.cvDiagnosticsRepository.find({
      where: { profileId: profile.id },
      order: { createdAt: 'DESC' },
    });
  }

  async findMyLatestCvDiagnostic(
    authUser: AuthTokenPayload,
  ): Promise<CvDiagnostic> {
    this.ensureTalent(authUser);

    const profile = await this.findMyProfile(authUser.userId);
    const diagnostic = await this.cvDiagnosticsRepository.findOne({
      where: { profileId: profile.id },
      order: { createdAt: 'DESC' },
    });

    if (!diagnostic) {
      throw new NotFoundException('No CV diagnostics found for this user');
    }

    return diagnostic;
  }

  async importMyCvFromLinkedIn(
    authUser: AuthTokenPayload,
    payload: ImportLinkedInCvDto,
  ): Promise<LinkedInCvImportResponse> {
    this.ensureTalent(authUser);

    const manualExtractedText = payload.extractedText?.trim() ?? '';

    return {
      sourceUrl: payload.linkedinUrl?.trim() || 'linkedin_disabled',
      extractedText: manualExtractedText,
      extractedTextLength: manualExtractedText.length,
      summary:
        'La importacion de CV desde LinkedIn esta deshabilitada temporalmente. Usa la carga de CV por PDF o texto.',
    };
  }

  private async findMyProfile(userId: string): Promise<Profile> {
    const profile = await this.profilesRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    return profile;
  }

  private ensureTalent(authUser: AuthTokenPayload): void {
    if (authUser.role !== UserRole.TALENT) {
      throw new ForbiddenException('Only TALENT users can manage profiles');
    }
  }

  private calculateEmployabilityScore(
    profile: Profile,
    hasAssessment: boolean,
    progressRecords: UserModuleProgress[],
    userSkills: UserSkill[],
  ): number {
    const profileScore = this.calculateProfileCompleteness(profile) * 20;
    const assessmentScore = hasAssessment ? 20 : 0;
    const progressScore = this.calculateAverageProgress(progressRecords) * 35;
    const skillsScore = this.calculateSkillsScore(userSkills) * 25;

    return Math.min(
      100,
      Math.round(profileScore + assessmentScore + progressScore + skillsScore),
    );
  }

  private calculateProfileCompleteness(profile: Profile): number {
    const fields = [
      profile.fullName,
      profile.location,
      profile.country,
      profile.preferredModality,
      this.hasInterestedRoles(profile) ? profile.interestedRoles : undefined,
      profile.currentStatus,
      profile.headline,
      profile.professionalBio,
      profile.yearsExperience,
    ];
    const completedFields = fields.filter(
      (value) => value !== null && value !== undefined && value !== '',
    ).length;

    return completedFields / fields.length;
  }

  private hasInterestedRoles(profile: Profile): boolean {
    return (
      Array.isArray(profile.interestedRoles) &&
      profile.interestedRoles.length > 0
    );
  }

  private calculateAverageProgress(
    progressRecords: UserModuleProgress[],
  ): number {
    if (progressRecords.length === 0) {
      return 0;
    }

    const totalProgress = progressRecords.reduce(
      (total, progressRecord) => total + progressRecord.progress,
      0,
    );

    return totalProgress / progressRecords.length / 100;
  }

  private calculateSkillsScore(userSkills: UserSkill[]): number {
    if (userSkills.length === 0) {
      return 0;
    }

    const skillQuantityScore = Math.min(userSkills.length / 5, 1) * 0.4;
    const levelScore =
      (userSkills.reduce(
        (total, userSkill) => total + this.getSkillLevelWeight(userSkill.level),
        0,
      ) /
        userSkills.length) *
      0.6;

    return skillQuantityScore + levelScore;
  }

  private getSkillLevelWeight(level: SkillLevel): number {
    if (level === SkillLevel.ADVANCED) {
      return 1;
    }

    if (level === SkillLevel.MEDIUM) {
      return 0.65;
    }

    return 0.35;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }

  private async extractCvText(
    file: UploadedCvFile | undefined,
    extractedText: string | undefined,
  ): Promise<string> {
    const normalizedExtractedText = extractedText?.trim();

    if (normalizedExtractedText) {
      return normalizedExtractedText;
    }

    if (!file) {
      throw new BadRequestException('CV file or extractedText is required');
    }

    if (this.isPdfFile(file)) {
      return this.extractPdfText(file);
    }

    if (!this.isTextFile(file)) {
      throw new BadRequestException(
        'Only PDF and text/plain files can be read directly. For DOCX, send extractedText with the file.',
      );
    }

    const fileText = file.buffer.toString('utf8').trim();

    if (!fileText) {
      throw new BadRequestException('CV text is empty');
    }

    return fileText;
  }

  private async extractPdfText(file: UploadedCvFile): Promise<string> {
    const parser = new PDFParse({ data: file.buffer });

    try {
      const result = await parser.getText();
      const text = result.text.trim();

      if (!text) {
        throw new BadRequestException('PDF text is empty');
      }

      return text;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('PDF could not be parsed');
    } finally {
      await parser.destroy();
    }
  }

  private isPdfFile(file: UploadedCvFile): boolean {
    return (
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf')
    );
  }

  private isTextFile(file: UploadedCvFile): boolean {
    return (
      file.mimetype === 'text/plain' ||
      file.originalname.toLowerCase().endsWith('.txt')
    );
  }

  private applyProfileSuggestions(
    profile: Profile,
    analysis: AiCvAnalysis,
  ): string[] {
    const appliedFields: string[] = [];
    const suggestions = analysis.profileSuggestions;

    if (suggestions.fullName && !profile.fullName) {
      profile.fullName = suggestions.fullName;
      appliedFields.push('fullName');
    }

    if (suggestions.location && !profile.location) {
      profile.location = suggestions.location;
      appliedFields.push('location');
    }

    if (suggestions.country && !profile.country) {
      profile.country = suggestions.country;
      appliedFields.push('country');
    }

    if (suggestions.preferredModality && !profile.preferredModality) {
      profile.preferredModality = suggestions.preferredModality;
      appliedFields.push('preferredModality');
    }

    if (suggestions.headline && !profile.headline) {
      profile.headline = suggestions.headline;
      appliedFields.push('headline');
    }

    if (suggestions.professionalBio && !profile.professionalBio) {
      profile.professionalBio = suggestions.professionalBio;
      appliedFields.push('professionalBio');
    }

    if (
      suggestions.yearsExperience !== undefined &&
      profile.yearsExperience === undefined
    ) {
      profile.yearsExperience = suggestions.yearsExperience;
      appliedFields.push('yearsExperience');
    }

    if (
      suggestions.interestedRoles &&
      suggestions.interestedRoles.length > 0 &&
      !this.hasInterestedRoles(profile)
    ) {
      profile.interestedRoles = suggestions.interestedRoles;
      appliedFields.push('interestedRoles');
    }

    return appliedFields;
  }

  private normalizeSkillCategory(category: string): 'technical' | 'personal' {
    const normalized = (category || '').trim().toLowerCase();

    if (
      normalized.includes('personal') ||
      normalized.includes('soft') ||
      normalized.includes('blanda') ||
      normalized.includes('behavior') ||
      normalized.includes('socio')
    ) {
      return 'personal';
    }

    return 'technical';
  }

  private buildFallbackCvAnalysis(cvText: string): AiCvAnalysis {
    const compactText = cvText.replace(/\s+/g, ' ').trim();
    const firstLine = cvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0);

    const modality = this.inferWorkModality(compactText);
    const yearsExperience = this.inferYearsExperience(compactText);
    const interestedRoles = this.inferInterestedRoles(compactText);
    const suggestedSkills = this.extractSkillsFromText(compactText);

    return {
      summary:
        'Analisis generado en modo compatible para soportar diferentes formatos de CV. Revisa y ajusta los datos sugeridos.',
      profileSuggestions: {
        fullName: undefined,
        location: undefined,
        country: undefined,
        preferredModality: modality,
        headline: firstLine && firstLine.length <= 120 ? firstLine : undefined,
        professionalBio: compactText.slice(0, 500) || undefined,
        yearsExperience,
        interestedRoles,
      },
      assessmentSuggestions: {
        digitalLevel: AssessmentLevel.INTERMEDIATE,
        cognitiveLevel: AssessmentLevel.INTERMEDIATE,
        socioEmotionalLevel: AssessmentLevel.INTERMEDIATE,
        careerGoal: undefined,
        answers: {
          source: 'fallback',
          note: 'AI CV analysis unavailable; generated from text heuristics.',
        },
      },
      suggestedSkills,
    };
  }

  private inferWorkModality(text: string): WorkModality | undefined {
    const lower = text.toLowerCase();

    if (
      lower.includes('remoto') ||
      lower.includes('remote') ||
      lower.includes('virtual')
    ) {
      return WorkModality.VIRTUAL;
    }

    if (lower.includes('hibrido') || lower.includes('híbrido') || lower.includes('hybrid')) {
      return WorkModality.HIBRIDO;
    }

    if (
      lower.includes('presencial') ||
      lower.includes('onsite') ||
      lower.includes('on-site')
    ) {
      return WorkModality.PRESENCIAL;
    }

    return undefined;
  }

  private inferYearsExperience(text: string): number | undefined {
    const yearsMatch = text.match(/(\d{1,2})\s*\+?\s*(anios|años|years)/i);
    if (!yearsMatch) {
      return undefined;
    }

    const years = Number(yearsMatch[1]);
    if (!Number.isFinite(years)) {
      return undefined;
    }

    return Math.max(0, Math.min(years, 80));
  }

  private inferInterestedRoles(text: string): InterestedRole[] {
    const lower = text.toLowerCase();
    const roles: InterestedRole[] = [];

    if (/(backend|node|java|\.net|spring|api)/i.test(lower)) {
      roles.push(InterestedRole.BACKEND_DEVELOPER);
    }

    if (/(frontend|react|angular|vue|javascript|typescript|css|html)/i.test(lower)) {
      roles.push(InterestedRole.FRONTEND_DEVELOPER);
    }

    if (/(fullstack|full stack)/i.test(lower)) {
      roles.push(InterestedRole.FULLSTACK_DEVELOPER);
    }

    if (/(qa|tester|testing|pruebas)/i.test(lower)) {
      roles.push(InterestedRole.QA_TESTER);
    }

    if (/(data|analyst|analista|sql|bi|power bi|tableau)/i.test(lower)) {
      roles.push(InterestedRole.DATA_ANALYST);
    }

    if (/(ux|ui|figma|disenador|diseñador)/i.test(lower)) {
      roles.push(InterestedRole.UX_UI_DESIGNER);
    }

    if (/(soporte|support|help desk|mesa de ayuda)/i.test(lower)) {
      roles.push(InterestedRole.SUPPORT_IT);
    }

    if (/(ciberseguridad|cybersecurity|pentest|soc)/i.test(lower)) {
      roles.push(InterestedRole.CYBERSECURITY_TRAINEE);
    }

    return Array.from(new Set(roles));
  }

  private extractSkillsFromText(text: string): AiCvAnalysis['suggestedSkills'] {
    const catalog: Array<{
      term: string;
      category: 'technical' | 'personal';
      normalizedName: string;
    }> = [
      { term: 'react', category: 'technical', normalizedName: 'react' },
      { term: 'angular', category: 'technical', normalizedName: 'angular' },
      { term: 'vue', category: 'technical', normalizedName: 'vue' },
      { term: 'javascript', category: 'technical', normalizedName: 'javascript' },
      { term: 'typescript', category: 'technical', normalizedName: 'typescript' },
      { term: 'node', category: 'technical', normalizedName: 'node.js' },
      { term: 'python', category: 'technical', normalizedName: 'python' },
      { term: 'java', category: 'technical', normalizedName: 'java' },
      { term: 'sql', category: 'technical', normalizedName: 'sql' },
      { term: 'excel', category: 'technical', normalizedName: 'excel' },
      { term: 'power bi', category: 'technical', normalizedName: 'power bi' },
      { term: 'tableau', category: 'technical', normalizedName: 'tableau' },
      { term: 'contabilidad', category: 'technical', normalizedName: 'contabilidad' },
      {
        term: 'contabilidad general',
        category: 'technical',
        normalizedName: 'contabilidad general',
      },
      {
        term: 'contabilidad financiera',
        category: 'technical',
        normalizedName: 'contabilidad financiera',
      },
      { term: 'nomina', category: 'technical', normalizedName: 'nomina' },
      { term: 'nómina', category: 'technical', normalizedName: 'nomina' },
      {
        term: 'gestion de nomina',
        category: 'technical',
        normalizedName: 'gestion de nomina',
      },
      {
        term: 'gestión de nómina',
        category: 'technical',
        normalizedName: 'gestion de nomina',
      },
      { term: 'finanzas', category: 'technical', normalizedName: 'finanzas' },
      { term: 'sap', category: 'technical', normalizedName: 'sap' },
      { term: 'facturacion', category: 'technical', normalizedName: 'facturacion' },
      { term: 'facturación', category: 'technical', normalizedName: 'facturacion' },
      { term: 'tesoreria', category: 'technical', normalizedName: 'tesoreria' },
      { term: 'tesorería', category: 'technical', normalizedName: 'tesoreria' },
      {
        term: 'conciliacion bancaria',
        category: 'technical',
        normalizedName: 'conciliacion bancaria',
      },
      {
        term: 'conciliación bancaria',
        category: 'technical',
        normalizedName: 'conciliacion bancaria',
      },
      { term: 'retenciones', category: 'technical', normalizedName: 'retenciones' },
      { term: 'niif', category: 'technical', normalizedName: 'niif' },
      { term: 'profit plus', category: 'technical', normalizedName: 'profit plus' },
      { term: 'erp profit plus', category: 'technical', normalizedName: 'erp profit plus' },
      { term: 'quickbooks', category: 'technical', normalizedName: 'quickbooks' },
      {
        term: 'auxiliar administrativo',
        category: 'technical',
        normalizedName: 'auxiliar administrativo',
      },
      {
        term: 'administracion',
        category: 'technical',
        normalizedName: 'administracion',
      },
      {
        term: 'administración',
        category: 'technical',
        normalizedName: 'administracion',
      },
      {
        term: 'gestion administrativa',
        category: 'technical',
        normalizedName: 'gestion administrativa',
      },
      {
        term: 'gestión administrativa',
        category: 'technical',
        normalizedName: 'gestion administrativa',
      },
      {
        term: 'gestion documental',
        category: 'technical',
        normalizedName: 'gestion documental',
      },
      {
        term: 'gestión documental',
        category: 'technical',
        normalizedName: 'gestion documental',
      },
      { term: 'archivo', category: 'technical', normalizedName: 'archivo' },
      {
        term: 'atencion al cliente',
        category: 'technical',
        normalizedName: 'atencion al cliente',
      },
      {
        term: 'atención al cliente',
        category: 'technical',
        normalizedName: 'atencion al cliente',
      },
      { term: 'paquete office', category: 'technical', normalizedName: 'paquete office' },
      { term: 'word', category: 'technical', normalizedName: 'word' },
      { term: 'excel', category: 'technical', normalizedName: 'excel' },
      { term: 'powerpoint', category: 'technical', normalizedName: 'powerpoint' },
      { term: 'historia clinica', category: 'technical', normalizedName: 'historia clinica' },
      { term: 'historia clínica', category: 'technical', normalizedName: 'historia clinica' },
      { term: 'medico', category: 'technical', normalizedName: 'medicina' },
      { term: 'médico', category: 'technical', normalizedName: 'medicina' },
      {
        term: 'medicina general',
        category: 'technical',
        normalizedName: 'medicina general',
      },
      { term: 'triaje', category: 'technical', normalizedName: 'triaje' },
      { term: 'triage', category: 'technical', normalizedName: 'triaje' },
      { term: 'consulta externa', category: 'technical', normalizedName: 'consulta externa' },
      {
        term: 'diagnostico medico',
        category: 'technical',
        normalizedName: 'diagnostico medico',
      },
      {
        term: 'diagnóstico médico',
        category: 'technical',
        normalizedName: 'diagnostico medico',
      },
      { term: 'signos vitales', category: 'technical', normalizedName: 'signos vitales' },
      { term: 'farmacologia', category: 'technical', normalizedName: 'farmacologia' },
      { term: 'farmacología', category: 'technical', normalizedName: 'farmacologia' },
      { term: 'primeros auxilios', category: 'technical', normalizedName: 'primeros auxilios' },
      { term: 'enfermeria', category: 'technical', normalizedName: 'enfermeria' },
      { term: 'enfermería', category: 'technical', normalizedName: 'enfermeria' },
      {
        term: 'diagnostico clinico',
        category: 'technical',
        normalizedName: 'diagnostico clinico',
      },
      {
        term: 'diagnóstico clínico',
        category: 'technical',
        normalizedName: 'diagnostico clinico',
      },
      {
        term: 'mantenimiento preventivo',
        category: 'technical',
        normalizedName: 'mantenimiento preventivo',
      },
      {
        term: 'mantenimiento correctivo',
        category: 'technical',
        normalizedName: 'mantenimiento correctivo',
      },
      { term: 'electromecanica', category: 'technical', normalizedName: 'electromecanica' },
      { term: 'electromecánica', category: 'technical', normalizedName: 'electromecanica' },
      { term: 'electricidad', category: 'technical', normalizedName: 'electricidad' },
      { term: 'instrumentacion', category: 'technical', normalizedName: 'instrumentacion' },
      { term: 'instrumentación', category: 'technical', normalizedName: 'instrumentacion' },
      { term: 'autocad', category: 'technical', normalizedName: 'autocad' },
      { term: 'mecanica', category: 'technical', normalizedName: 'mecanica' },
      { term: 'mecánica', category: 'technical', normalizedName: 'mecanica' },
      {
        term: 'mecanica automotriz',
        category: 'technical',
        normalizedName: 'mecanica automotriz',
      },
      {
        term: 'mecánica automotriz',
        category: 'technical',
        normalizedName: 'mecanica automotriz',
      },
      {
        term: 'mantenimiento mecanico',
        category: 'technical',
        normalizedName: 'mantenimiento mecanico',
      },
      {
        term: 'mantenimiento mecánico',
        category: 'technical',
        normalizedName: 'mantenimiento mecanico',
      },
      { term: 'soldadura', category: 'technical', normalizedName: 'soldadura' },
      { term: 'metrologia', category: 'technical', normalizedName: 'metrologia' },
      { term: 'metrología', category: 'technical', normalizedName: 'metrologia' },
      {
        term: 'logistica militar',
        category: 'technical',
        normalizedName: 'logistica militar',
      },
      {
        term: 'logística militar',
        category: 'technical',
        normalizedName: 'logistica militar',
      },
      {
        term: 'operaciones militares',
        category: 'technical',
        normalizedName: 'operaciones militares',
      },
      {
        term: 'seguridad y defensa',
        category: 'technical',
        normalizedName: 'seguridad y defensa',
      },
      {
        term: 'cadena de mando',
        category: 'technical',
        normalizedName: 'cadena de mando',
      },
      {
        term: 'tacticas de patrullaje',
        category: 'technical',
        normalizedName: 'tacticas de patrullaje',
      },
      {
        term: 'tácticas de patrullaje',
        category: 'technical',
        normalizedName: 'tacticas de patrullaje',
      },
      {
        term: 'normativa castrense',
        category: 'technical',
        normalizedName: 'normativa castrense',
      },
      { term: 'comunicacion', category: 'personal', normalizedName: 'comunicacion' },
      { term: 'comunicación', category: 'personal', normalizedName: 'comunicacion' },
      { term: 'liderazgo', category: 'personal', normalizedName: 'liderazgo' },
      { term: 'trabajo en equipo', category: 'personal', normalizedName: 'trabajo en equipo' },
      { term: 'proactivo', category: 'personal', normalizedName: 'proactividad' },
      { term: 'proactiva', category: 'personal', normalizedName: 'proactividad' },
      {
        term: 'orientacion al detalle',
        category: 'personal',
        normalizedName: 'orientacion al detalle',
      },
      {
        term: 'orientación al detalle',
        category: 'personal',
        normalizedName: 'orientacion al detalle',
      },
      { term: 'responsabilidad', category: 'personal', normalizedName: 'responsabilidad' },
      { term: 'organizacion', category: 'personal', normalizedName: 'organizacion' },
      { term: 'organización', category: 'personal', normalizedName: 'organizacion' },
      { term: 'empatia', category: 'personal', normalizedName: 'empatia' },
      { term: 'empatía', category: 'personal', normalizedName: 'empatia' },
      {
        term: 'trabajo bajo presion',
        category: 'personal',
        normalizedName: 'trabajo bajo presion',
      },
      {
        term: 'trabajo bajo presión',
        category: 'personal',
        normalizedName: 'trabajo bajo presion',
      },
      {
        term: 'servicio al cliente',
        category: 'personal',
        normalizedName: 'servicio al cliente',
      },
    ];

    const found = catalog
      .filter((item) => this.containsTermWithBoundaries(text, item.term))
      .map((item) => ({
        name: item.normalizedName,
        category: item.category,
        level: SkillLevel.INITIAL,
      }));

    return Array.from(
      new Map(found.map((item) => [item.name.toLowerCase(), item])).values(),
    );
  }

  private normalizeForMatch(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private containsTermWithBoundaries(source: string, term: string): boolean {
    const normalizedSource = this.normalizeForMatch(source);
    const normalizedTerm = this.normalizeForMatch(term);

    if (!normalizedSource || !normalizedTerm) {
      return false;
    }

    const escapedTerm = normalizedTerm
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, '\\s+');

    const regex = new RegExp(
      `(?:^|[^\\p{L}\\p{N}])${escapedTerm}(?:$|[^\\p{L}\\p{N}])`,
      'iu',
    );

    return regex.test(normalizedSource);
  }

  private async replaceProfileCvSections(
    profileId: string,
    saveCvDiagnosticDto: SaveCvDiagnosticDto,
  ): Promise<void> {
    await Promise.all([
      this.profileExperiencesRepository.delete({ profileId }),
      this.profileEducationsRepository.delete({ profileId }),
    ]);

    const experiences = (saveCvDiagnosticDto.experience ?? []).map(
      (experience, index) =>
        this.profileExperiencesRepository.create({
          profileId,
          company: experience.company,
          position: experience.position,
          startDate: experience.startDate,
          endDate: experience.endDate,
          description: experience.description,
          highlights: experience.highlights ?? [],
          sortOrder: index,
        }),
    );

    const educations = (saveCvDiagnosticDto.education ?? []).map(
      (education, index) =>
        this.profileEducationsRepository.create({
          profileId,
          institution: education.institution,
          degree: education.degree,
          details: education.details,
          status: education.status,
          sortOrder: index,
        }),
    );

    if (experiences.length > 0) {
      await this.profileExperiencesRepository.save(experiences);
    }

    if (educations.length > 0) {
      await this.profileEducationsRepository.save(educations);
    }
  }
}
