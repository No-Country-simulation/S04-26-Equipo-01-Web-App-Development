import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

import type { AuthUser } from '../../types/auth.types';
import {
  acceptFinalistCandidate,
  createRecruiterSkill,
  createVacancy,
  getVacancyPipeline,
  getRecruiterSkills,
  getMyVacancies,
  getCandidates,
  getCandidateConsolidatedData,
  moveCandidateToFinalist,
  moveCandidateToSelected,
  type RecruiterSkillOption,
  type CreateVacancyPayload,
  type CandidateProfile as RealCandidateProfile,
  type RecruiterVacancy,
  type VacancyPipeline,
  type VacancyPipelineCandidate,
} from '../../services/recruiter.service';
import {
  addCourseMeetingLink,
  addCourseModule,
  approveCourse,
  archiveCourse,
  createCourse,
  deleteCourseMeetingLink,
  deleteCourseModule,
  listCourses,
  listMyCompanyCourses,
  updateCourse,
} from '../../services/course.service';
import {
  generateMyLearningPath,
  getMyLearningModules,
  getMyLearningPaths,
  updateMyModuleProgress,
} from '../../services/learning.service';
import {
  type AddMeetingLinkDto,
  CourseStatus,
  MeetingPlatform,
  type Course,
  type CourseStatus as CourseStatusType,
  type CreateCourseDto,
  type CreateCourseModuleDto,
  type MeetingPlatform as MeetingPlatformType,
} from '../../types/course.types';
import {
  ModuleStatus as LearningModuleStatus,
  type LearningModule,
  type LearningPath,
  type ModuleStatus,
} from '../../types/learning.types';
import VacancyTable from './VacancyTable';

interface CompanyDashboardProps {
  user: AuthUser;
}

type TalentDetailTab = 'skills' | 'cv';

interface CandidateProfileDetail {
  id?: string;
  name?: string;
  title?: string;
  email?: string;
  location?: string;
  skills?: Array<{ name?: string; category?: string; level?: number }>;
  cv?: {
    id?: string;
    fileName?: string | null;
    url?: string;
    uploadedAt?: string;
    summary?: string | null;
    technicalSkills?: string[];
    personalSkills?: string[];
    snapshot?: {
      profile?: {
        fullName?: string;
        email?: string;
        phone?: string;
        location?: string;
        title?: string;
        professionalSummary?: string;
      };
      skills?: {
        technical?: string[];
        personal?: string[];
      };
      experience?: Array<{ position?: string; company?: string; startDate?: string; endDate?: string; description?: string }>;
      education?: Array<{ institution?: string; degree?: string; details?: string; status?: string }>;
    } | null;
    parsed?: {
      profile?: { summary?: string; professionalSummary?: string; fullName?: string; email?: string; phone?: string; location?: string; title?: string };
      experience?: Array<{ position?: string; company?: string; startDate?: string; endDate?: string; description?: string }>;
      education?: Array<{ institution?: string; degree?: string; details?: string; status?: string }>;
      skills?: { technical?: string[]; personal?: string[] };
    } | null;
  } | null;
  assessmentResults?: Array<{ type: 'technical' | 'psychotechnical' | 'TECHNICAL' | 'PSYCHOTECHNICAL'; score: number; feedback?: string }>;
  courses?: Array<{
    id?: string;
    title?: string;
    description?: string;
    status?: 'pending' | 'in_progress' | 'completed' | string;
    progress?: number;
    modules?: number;
    completedModules?: number;
  }>;
  learningPath?: {
    id?: string;
    status?: string;
    progress?: number;
    title?: string;
    objective?: string;
    modules?: Array<Record<string, unknown>>;
  } | null;
}

interface CandidateProfile {
  id: string;
  fullName: string;
  title: string;
  location: string;
  skillsValidated: string[];
  cvSummary: string;
  technicalResult: {
    scorePct: number;
    feedback: string;
  };
  psychotechnicalResult: {
    scorePct: number;
    feedback: string;
  };
  roadmapRecommended: string[];
  pendingCourses: string[];
  approvedCourses: string[];
}

interface RecruiterRequestFormState {
  title: string;
  area: string;
  modality: 'remote' | 'hybrid' | 'onsite';
  location: string;
  contractType: 'full-time' | 'part-time' | 'contractor' | 'internship';
  seniority: 'junior' | 'mid' | 'senior' | 'lead';
  vacancies: number;
  salaryMin: string;
  salaryMax: string;
  description: string;
  responsibilitiesText: string;
  requiredSkills: string[];
  optionalSkillsText: string;
}

interface SkillOption {
  id: string;
  name: string;
  category: string;
}

interface DashboardMetrics {
  openVacancies: number;
  availableCandidates: number;
  preselectedCandidates: number;
  selectedCandidates: number;
  finalistCandidates: number;
  finishedRecruitmentProcesses: number;
}

interface CourseFormState {
  title: string;
  description: string;
  status: CourseStatusType;
}

interface CourseModuleFormState {
  courseId: string;
  title: string;
  description: string;
  order: number;
  videoUrl: string;
  documentationUrl: string;
  durationMin: string;
}

interface CourseMeetingFormState {
  courseId: string;
  url: string;
  platform: MeetingPlatformType;
  scheduledDate: string;
  scheduledTime: string;
  password: string;
  notes: string;
}

interface WorkshopGenerateFormState {
  title: string;
  objective: string;
}

const mapRecruiterSkillToOption = (skill: RecruiterSkillOption): SkillOption => ({
  id: skill.id,
  name: skill.name,
  category: skill.category,
});

const INITIAL_REQUEST_FORM: RecruiterRequestFormState = {
  title: '',
  area: '',
  modality: 'hybrid',
  location: '',
  contractType: 'full-time',
  seniority: 'mid',
  vacancies: 1,
  salaryMin: '',
  salaryMax: '',
  description: '',
  responsibilitiesText: '',
  requiredSkills: [],
  optionalSkillsText: '',
};

const INITIAL_COURSE_FORM: CourseFormState = {
  title: '',
  description: '',
  status: CourseStatus.DRAFT,
};

const INITIAL_COURSE_MODULE_FORM: CourseModuleFormState = {
  courseId: '',
  title: '',
  description: '',
  order: 1,
  videoUrl: '',
  documentationUrl: '',
  durationMin: '',
};

const INITIAL_COURSE_MEETING_FORM: CourseMeetingFormState = {
  courseId: '',
  url: '',
  platform: MeetingPlatform.GOOGLE_MEET,
  scheduledDate: '',
  scheduledTime: '',
  password: '',
  notes: '',
};

const INITIAL_WORKSHOP_GENERATE_FORM: WorkshopGenerateFormState = {
  title: '',
  objective: '',
};

const INITIAL_DASHBOARD_METRICS: DashboardMetrics = {
  openVacancies: 0,
  availableCandidates: 0,
  preselectedCandidates: 0,
  selectedCandidates: 0,
  finalistCandidates: 0,
  finishedRecruitmentProcesses: 0,
};

export const CompanyDashboard = ({ user }: CompanyDashboardProps) => {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  const [dashboardMetrics, setDashboardMetrics] =
    useState<DashboardMetrics>(INITIAL_DASHBOARD_METRICS);
  const [loadingDashboardMetrics, setLoadingDashboardMetrics] =
    useState(false);

  const loadCandidates = async () => {
    setLoadingCandidates(true);
    setCandidatesError(null);
    try {
      const realCandidates = await getCandidates();
      const mappedCandidates: CandidateProfile[] = (realCandidates || []).map((candidate: RealCandidateProfile) => ({
        id: String(candidate.id || ''),
        fullName: String(candidate.name || candidate.fullName || 'Sin nombre'),
        title: String(candidate.title || candidate.headline || 'N/A'),
        location: String(candidate.location || 'N/A'),
        skillsValidated: Array.isArray(candidate.skills)
          ? candidate.skills
              .map((s) => {
                if (s && typeof s === 'object' && 'name' in s && typeof s.name === 'string') {
                  return s.name;
                }

                if (
                  s &&
                  typeof s === 'object' &&
                  'skill' in s &&
                  (s as { skill?: { name?: unknown } }).skill &&
                  typeof (s as { skill?: { name?: unknown } }).skill?.name === 'string'
                ) {
                  return String((s as { skill?: { name?: string } }).skill?.name || '');
                }

                return '';
              })
              .filter((name): name is string => Boolean(name && name.trim()))
          : [],
        cvSummary: String(candidate.summary || ''),
        technicalResult: {
          scorePct: 0,
          feedback: 'Aún sin prueba técnica completada',
        },
        psychotechnicalResult: {
          scorePct: 0,
          feedback: 'Aún sin prueba psicotécnica completada',
        },
        roadmapRecommended: [],
        pendingCourses: [],
        approvedCourses: [],
      }));

      setCandidates(mappedCandidates);
    } catch (error) {
      console.warn('No se pudieron cargar candidatos reales desde backend', error);
      setCandidates([]);
      setCandidatesError('No se pudo cargar la lista de candidatos desde backend.');
    } finally {
      setLoadingCandidates(false);
    }
  };

  const loadDashboardMetrics = async () => {
    setLoadingDashboardMetrics(true);

    try {
      const [vacancies, candidatePool] = await Promise.all([
        getMyVacancies(),
        getCandidates(),
      ]);

      const pipelines = await Promise.all(
        vacancies.map(async (vacancy) => {
          const pipeline = await getVacancyPipeline(vacancy.id);
          return pipeline;
        }),
      );

      const accumulated = pipelines.reduce(
        (metrics, pipeline) => {
          if (!pipeline) {
            return metrics;
          }

          const preselected = pipeline.preselected?.length || 0;
          const selected = pipeline.selected?.length || 0;
          const finalists = pipeline.finalists?.length || 0;
          const accepted = pipeline.accepted?.length || 0;

          metrics.preselectedCandidates += preselected;
          metrics.selectedCandidates += selected;
          metrics.finalistCandidates += finalists;

          if (accepted > 0) {
            metrics.finishedRecruitmentProcesses += 1;
          }

          return metrics;
        },
        {
          ...INITIAL_DASHBOARD_METRICS,
        },
      );

      const availableCandidatesCount =
        accumulated.preselectedCandidates +
        accumulated.selectedCandidates +
        accumulated.finalistCandidates;

      const finishedRecruitmentProcesses =
        accumulated.finishedRecruitmentProcesses;

      setDashboardMetrics({
        openVacancies: Math.max(vacancies.length - finishedRecruitmentProcesses, 0),
        availableCandidates:
          availableCandidatesCount > 0
            ? availableCandidatesCount
            : candidatePool.length,
        preselectedCandidates: accumulated.preselectedCandidates,
        selectedCandidates: accumulated.selectedCandidates,
        finalistCandidates: accumulated.finalistCandidates,
        finishedRecruitmentProcesses,
      });
    } catch (error) {
      console.warn('No se pudieron calcular metricas del dashboard', error);
      setDashboardMetrics(INITIAL_DASHBOARD_METRICS);
    } finally {
      setLoadingDashboardMetrics(false);
    }
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void Promise.all([loadCandidates(), loadDashboardMetrics()]);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, []);

  const sidebarSections = [
    {
      title: 'TALENTO',
      items: ['Perfil Candidato', 'Skills Validadas', 'CV / Living Profile', 'Cursos Realizados'],
    },
    {
      title: 'VACANTES / SOLICITUD',
      items: ['Crear Solicitud', 'Mis Solicitudes', 'Candidatos Preseleccionados', 'Seleccionados', 'Finalistas'],
    },
    {
      title: 'ACADEMIA PRO',
      items: ['Cursos', 'Talleres'],
    },
  ];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    TALENTO: true,
    'VACANTES / SOLICITUD': true,
    'ACADEMIA PRO': true,
  });
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);
  const [searchByName, setSearchByName] = useState('');
  const [searchByTitle, setSearchByTitle] = useState('');
  const [searchBySkill, setSearchBySkill] = useState('');
  const [appliedSearchByName, setAppliedSearchByName] = useState('');
  const [appliedSearchByTitle, setAppliedSearchByTitle] = useState('');
  const [appliedSearchBySkill, setAppliedSearchBySkill] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [talentDetailTab, setTalentDetailTab] = useState<TalentDetailTab>('skills');
  const [selectedPendingCourse, setSelectedPendingCourse] = useState<string | null>(null);
  const [selectedCandidateDetails, setSelectedCandidateDetails] = useState<CandidateProfileDetail | null>(null);
  const [loadingCandidateDetails, setLoadingCandidateDetails] = useState(false);
  const [requestForm, setRequestForm] = useState<RecruiterRequestFormState>(INITIAL_REQUEST_FORM);
  const [availableSkills, setAvailableSkills] = useState<SkillOption[]>([]);
  const [skillsLoaded, setSkillsLoaded] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [selectedExistingSkill, setSelectedExistingSkill] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('technical');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [myVacancies, setMyVacancies] = useState<RecruiterVacancy[]>([]);
  const [loadingVacancies, setLoadingVacancies] = useState(false);
  const [selectedVacancyId, setSelectedVacancyId] = useState('');
  const [requestFeedback, setRequestFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [pipelineFeedback, setPipelineFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [vacancyPipeline, setVacancyPipeline] = useState<VacancyPipeline | null>(null);
  const [loadingVacancyPipeline, setLoadingVacancyPipeline] = useState(false);
  const [updatingCandidateId, setUpdatingCandidateId] = useState<string | null>(null);

  const [academyCourses, setAcademyCourses] = useState<Course[]>([]);
  const [loadingAcademyCourses, setLoadingAcademyCourses] = useState(false);
  const [courseFilters, setCourseFilters] = useState<{ published: boolean }>({
    published: false,
  });
  const [courseForm, setCourseForm] = useState<CourseFormState>(
    INITIAL_COURSE_FORM,
  );
  const [courseModuleForm, setCourseModuleForm] =
    useState<CourseModuleFormState>(INITIAL_COURSE_MODULE_FORM);
  const [courseMeetingForm, setCourseMeetingForm] =
    useState<CourseMeetingFormState>(INITIAL_COURSE_MEETING_FORM);
  const [academyFeedback, setAcademyFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [savingCourseAction, setSavingCourseAction] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const [myLearningPaths, setMyLearningPaths] = useState<LearningPath[]>([]);
  const [myLearningModules, setMyLearningModules] = useState<LearningModule[]>(
    [],
  );
  const [loadingWorkshops, setLoadingWorkshops] = useState(false);
  const [workshopGenerateForm, setWorkshopGenerateForm] =
    useState<WorkshopGenerateFormState>(INITIAL_WORKSHOP_GENERATE_FORM);
  const [workshopCandidateId, setWorkshopCandidateId] = useState('');
  const [workshopPlatformFilter, setWorkshopPlatformFilter] =
    useState<'ALL' | MeetingPlatformType>('ALL');
  const [workshopCourseFilter, setWorkshopCourseFilter] = useState('ALL');
  const [workshopFeedback, setWorkshopFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const userRoles = useMemo(() => {
    const fromSingleRole =
      typeof user.role === 'string' && user.role.trim() !== ''
        ? [user.role]
        : [];
    const rawRoles = user.roles;
    const fromRolesArray = Array.isArray(rawRoles)
      ? rawRoles.filter((role) => typeof role === 'string' && role.trim() !== '')
      : [];

    const combined = [...fromSingleRole, ...fromRolesArray].map((role) =>
      role.toUpperCase(),
    );

    return Array.from(new Set(combined));
  }, [user.role, user.roles]);

  const canManageAcademyCourses = useMemo(
    () =>
      userRoles.includes('COMPANY') ||
      userRoles.includes('ADMIN') ||
      userRoles.includes('RECRUITER'),
    [userRoles],
  );

  const canUseTalentWorkshops = useMemo(
    () => userRoles.includes('TALENT'),
    [userRoles],
  );

  const canMonitorCandidateWorkshops = useMemo(
    () =>
      userRoles.includes('COMPANY') ||
      userRoles.includes('ADMIN') ||
      userRoles.includes('RECRUITER'),
    [userRoles],
  );

  const selectedVacancy = useMemo(
    () => myVacancies.find((vacancy) => vacancy.id === selectedVacancyId),
    [myVacancies, selectedVacancyId],
  );

  const requestPayload = useMemo<CreateVacancyPayload>(() => ({
    title: requestForm.title.trim(),
    modality: requestForm.modality,
    location: requestForm.location.trim(),
    description: requestForm.description.trim(),
    requiredSkills: requestForm.requiredSkills,
    vacancies: requestForm.vacancies,
  }), [requestForm]);

  const loadVacancyPipeline = async (vacancyId: string) => {
    if (!vacancyId) {
      setVacancyPipeline(null);
      return;
    }

    setLoadingVacancyPipeline(true);
    setPipelineFeedback(null);
    try {
      const pipeline = await getVacancyPipeline(vacancyId);
      setVacancyPipeline(pipeline);
    } catch (error) {
      console.warn('No se pudo cargar el pipeline de la vacante', error);
      setVacancyPipeline(null);
      setPipelineFeedback({
        type: 'error',
        message: 'No fue posible cargar el pipeline de candidatos de esta vacante.',
      });
    } finally {
      setLoadingVacancyPipeline(false);
    }
  };

  const updateCandidateStage = async (
    candidateId: string,
    action: 'selected' | 'finalist' | 'accepted',
  ) => {
    if (!selectedVacancyId) {
      setPipelineFeedback({
        type: 'info',
        message: 'Selecciona primero una vacante para mover candidatos entre etapas.',
      });
      return;
    }

    setUpdatingCandidateId(candidateId);
    try {
      if (action === 'selected') {
        await moveCandidateToSelected(selectedVacancyId, candidateId);
      }

      if (action === 'finalist') {
        await moveCandidateToFinalist(selectedVacancyId, candidateId);
      }

      if (action === 'accepted') {
        await acceptFinalistCandidate(selectedVacancyId, candidateId);
      }

      await loadVacancyPipeline(selectedVacancyId);
      await loadDashboardMetrics();
      setPipelineFeedback({
        type: 'success',
        message:
          action === 'selected'
            ? 'Candidato movido a Seleccionados.'
            : action === 'finalist'
              ? 'Candidato movido a Finalistas.'
              : 'Candidato aceptado correctamente.',
      });
    } catch (error) {
      const errorMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message !== 'undefined'
          ? (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : 'No se pudo actualizar el estado del candidato.';

      setPipelineFeedback({
        type: 'error',
        message: Array.isArray(errorMessage)
          ? errorMessage.join(', ')
          : errorMessage || 'No se pudo actualizar el estado del candidato.',
      });
    } finally {
      setUpdatingCandidateId(null);
    }
  };

  const normalizeModality = (
    value?: string,
  ): RecruiterRequestFormState['modality'] => {
    const raw = (value || '').toLowerCase();
    if (raw.includes('remote') || raw.includes('remoto')) return 'remote';
    if (raw.includes('onsite') || raw.includes('presencial')) return 'onsite';
    return 'hybrid';
  };

  const loadMyCreatedVacancies = async () => {
    setLoadingVacancies(true);
    try {
      const vacancies = await getMyVacancies();
      setMyVacancies((previousVacancies) => {
        if (selectedVacancyId && vacancies.length === 0 && previousVacancies.length > 0) {
          return previousVacancies;
        }

        return vacancies;
      });
    } catch (error) {
      console.warn('No se pudieron cargar vacantes creadas', error);
    } finally {
      setLoadingVacancies(false);
    }
  };

  const loadAcademyCourses = async () => {
    setLoadingAcademyCourses(true);
    setAcademyFeedback(null);
    try {
      const isAdminWithoutCompany =
        userRoles.includes('ADMIN') && !userRoles.includes('COMPANY');
      const courses = isAdminWithoutCompany
        ? await listCourses({ published: courseFilters.published })
        : await listMyCompanyCourses({ published: courseFilters.published });

      setAcademyCourses(courses);
      if (courses.length === 0) {
        setExpandedCourseId(null);
        return;
      }

      if (!expandedCourseId || !courses.some((course) => course.id === expandedCourseId)) {
        setExpandedCourseId(courses[0].id);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los cursos de la academia.';
      setAcademyFeedback({ type: 'error', message });
      setAcademyCourses([]);
      setExpandedCourseId(null);
    } finally {
      setLoadingAcademyCourses(false);
    }
  };

  const loadWorkshops = async () => {
    setLoadingWorkshops(true);
    setWorkshopFeedback(null);

    if (!canUseTalentWorkshops) {
      setMyLearningPaths([]);
      setMyLearningModules([]);
      setLoadingWorkshops(false);
      return;
    }

    try {
      const [paths, modules] = await Promise.all([
        getMyLearningPaths(),
        getMyLearningModules(),
      ]);
      setMyLearningPaths(paths);
      setMyLearningModules(modules);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los talleres.';
      setWorkshopFeedback({ type: 'error', message });
      setMyLearningPaths([]);
      setMyLearningModules([]);
    } finally {
      setLoadingWorkshops(false);
    }
  };

  const submitNewCourse = async () => {
    if (!courseForm.title.trim()) {
      setAcademyFeedback({
        type: 'info',
        message: 'Ingresa un titulo para crear el curso.',
      });
      return;
    }

    setSavingCourseAction(true);
    setAcademyFeedback(null);
    try {
      const payload: CreateCourseDto = {
        title: courseForm.title.trim(),
        description: courseForm.description.trim() || undefined,
        status: courseForm.status,
      };

      await createCourse(payload);
      setCourseForm(INITIAL_COURSE_FORM);
      await loadAcademyCourses();
      setAcademyFeedback({
        type: 'success',
        message: 'Curso creado correctamente.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo crear el curso.';
      setAcademyFeedback({ type: 'error', message });
    } finally {
      setSavingCourseAction(false);
    }
  };

  const submitCourseModule = async () => {
    if (!courseModuleForm.courseId) {
      setAcademyFeedback({
        type: 'info',
        message: 'Selecciona un curso para agregar el modulo.',
      });
      return;
    }

    if (!courseModuleForm.title.trim()) {
      setAcademyFeedback({
        type: 'info',
        message: 'Ingresa el titulo del modulo.',
      });
      return;
    }

    setSavingCourseAction(true);
    setAcademyFeedback(null);
    try {
      const payload: CreateCourseModuleDto = {
        title: courseModuleForm.title.trim(),
        description: courseModuleForm.description.trim() || undefined,
        order: Number(courseModuleForm.order) || 1,
        videoUrl: courseModuleForm.videoUrl.trim() || undefined,
        documentationUrl: courseModuleForm.documentationUrl.trim() || undefined,
        durationMin: courseModuleForm.durationMin
          ? Number(courseModuleForm.durationMin)
          : undefined,
      };

      await addCourseModule(courseModuleForm.courseId, payload);
      setCourseModuleForm((prev) => ({
        ...INITIAL_COURSE_MODULE_FORM,
        courseId: prev.courseId,
      }));
      setExpandedCourseId(courseModuleForm.courseId);
      await loadAcademyCourses();
      setAcademyFeedback({
        type: 'success',
        message: 'Modulo agregado al curso.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo agregar el modulo.';
      setAcademyFeedback({ type: 'error', message });
    } finally {
      setSavingCourseAction(false);
    }
  };

  const submitMeetingLink = async () => {
    if (!courseMeetingForm.courseId) {
      setAcademyFeedback({
        type: 'info',
        message: 'Selecciona un curso para agregar el link de reunion.',
      });
      return;
    }

    if (!courseMeetingForm.url.trim()) {
      setAcademyFeedback({
        type: 'info',
        message: 'Ingresa la URL del taller en vivo.',
      });
      return;
    }

    if (!courseMeetingForm.scheduledDate || !courseMeetingForm.scheduledTime) {
      setAcademyFeedback({
        type: 'info',
        message: 'Selecciona la fecha y hora del taller.',
      });
      return;
    }

    const scheduledAtCandidate = new Date(
      `${courseMeetingForm.scheduledDate}T${courseMeetingForm.scheduledTime}`,
    );

    if (Number.isNaN(scheduledAtCandidate.getTime())) {
      setAcademyFeedback({
        type: 'error',
        message: 'La fecha y hora del taller no tienen un formato valido.',
      });
      return;
    }

    setSavingCourseAction(true);
    setAcademyFeedback(null);
    try {
      const payload: AddMeetingLinkDto = {
        url: courseMeetingForm.url.trim(),
        platform: courseMeetingForm.platform,
        scheduledAt: scheduledAtCandidate.toISOString(),
        password: courseMeetingForm.password.trim() || undefined,
        notes: courseMeetingForm.notes.trim() || undefined,
      };

      await addCourseMeetingLink(courseMeetingForm.courseId, payload);
      setCourseMeetingForm((prev) => ({
        ...INITIAL_COURSE_MEETING_FORM,
        courseId: prev.courseId,
      }));
      setExpandedCourseId(courseMeetingForm.courseId);
      await loadAcademyCourses();
      setAcademyFeedback({
        type: 'success',
        message: 'Link de reunion agregado al curso.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo agregar el link.';
      setAcademyFeedback({ type: 'error', message });
    } finally {
      setSavingCourseAction(false);
    }
  };

  const changeCourseStatus = async (
    courseId: string,
    status: CourseStatusType,
  ) => {
    setSavingCourseAction(true);
    setAcademyFeedback(null);
    try {
      await updateCourse(courseId, { status });
      await loadAcademyCourses();
      setAcademyFeedback({
        type: 'success',
        message: 'Estado del curso actualizado.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado del curso.';
      setAcademyFeedback({ type: 'error', message });
    } finally {
      setSavingCourseAction(false);
    }
  };

  const publishCourseAsAdmin = async (courseId: string) => {
    setSavingCourseAction(true);
    setAcademyFeedback(null);
    try {
      await approveCourse(courseId);
      await loadAcademyCourses();
      setAcademyFeedback({
        type: 'success',
        message: 'Curso aprobado y publicado.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo aprobar el curso.';
      setAcademyFeedback({ type: 'error', message });
    } finally {
      setSavingCourseAction(false);
    }
  };

  const removeCourseByArchiving = async (courseId: string) => {
    setSavingCourseAction(true);
    setAcademyFeedback(null);
    try {
      await archiveCourse(courseId);
      await loadAcademyCourses();
      setAcademyFeedback({
        type: 'success',
        message: 'Curso archivado correctamente.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo archivar el curso.';
      setAcademyFeedback({ type: 'error', message });
    } finally {
      setSavingCourseAction(false);
    }
  };

  const removeModule = async (courseId: string, moduleId: string) => {
    setSavingCourseAction(true);
    setAcademyFeedback(null);
    try {
      await deleteCourseModule(courseId, moduleId);
      await loadAcademyCourses();
      setAcademyFeedback({
        type: 'success',
        message: 'Modulo eliminado del curso.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo eliminar el modulo.';
      setAcademyFeedback({ type: 'error', message });
    } finally {
      setSavingCourseAction(false);
    }
  };

  const removeMeetingLink = async (courseId: string, meetingLinkId: string) => {
    setSavingCourseAction(true);
    setAcademyFeedback(null);
    try {
      await deleteCourseMeetingLink(courseId, meetingLinkId);
      await loadAcademyCourses();
      setAcademyFeedback({
        type: 'success',
        message: 'Link eliminado del curso.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo eliminar el link.';
      setAcademyFeedback({ type: 'error', message });
    } finally {
      setSavingCourseAction(false);
    }
  };

  const createOrRefreshLearningPath = async () => {
    setLoadingWorkshops(true);
    setWorkshopFeedback(null);
    try {
      await generateMyLearningPath({
        title: workshopGenerateForm.title.trim() || undefined,
        objective: workshopGenerateForm.objective.trim() || undefined,
      });
      setWorkshopGenerateForm(INITIAL_WORKSHOP_GENERATE_FORM);
      await loadWorkshops();
      setWorkshopFeedback({
        type: 'success',
        message: 'Talleres generados/actualizados para tu perfil.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo generar la ruta de talleres.';
      setWorkshopFeedback({ type: 'error', message });
    } finally {
      setLoadingWorkshops(false);
    }
  };

  const markWorkshopModuleAsCompleted = async (moduleId: string) => {
    setLoadingWorkshops(true);
    setWorkshopFeedback(null);
    try {
      await updateMyModuleProgress(moduleId, {
        status: LearningModuleStatus.COMPLETED as ModuleStatus,
        progress: 100,
      });
      await loadWorkshops();
      setWorkshopFeedback({
        type: 'success',
        message: 'Taller marcado como completado.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el progreso del taller.';
      setWorkshopFeedback({ type: 'error', message });
    } finally {
      setLoadingWorkshops(false);
    }
  };

  const loadRequestSkills = async () => {
    if (skillsLoaded || loadingSkills) return;

    setLoadingSkills(true);
    try {
      const recruiterSkills = await getRecruiterSkills();
      const mappedSkills = recruiterSkills
        .map(mapRecruiterSkillToOption)
        .filter((skill) => Boolean(skill.name && skill.name.trim()));

      const uniqueSkills = mappedSkills.filter(
        (skill, index, arr) => arr.findIndex((s) => s.name.toLowerCase() === skill.name.toLowerCase()) === index,
      );

      setAvailableSkills(uniqueSkills);
      setRequestFeedback(null);
    } catch (error) {
      console.warn('No se pudieron cargar skills del endpoint /recruiter/skills', error);
      setRequestFeedback({
        type: 'info',
        message: 'No se pudo cargar el catalogo de skills. Puedes agregar skills nuevas.',
      });
    } finally {
      setSkillsLoaded(true);
      setLoadingSkills(false);
    }
  };

  const addRequiredSkill = (rawName: string) => {
    const normalized = rawName.trim();
    if (!normalized) return;

    setRequestForm((prev) => {
      const alreadyExists = prev.requiredSkills.some(
        (skill) => skill.toLowerCase() === normalized.toLowerCase(),
      );
      if (alreadyExists) return prev;

      return {
        ...prev,
        requiredSkills: [...prev.requiredSkills, normalized],
      };
    });
  };

  const removeRequiredSkill = (name: string) => {
    setRequestForm((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((skill) => skill.toLowerCase() !== name.toLowerCase()),
    }));
  };

  const addNewSkillIfNeeded = async () => {
    const normalized = newSkillName.trim();
    if (!normalized) {
      setRequestFeedback({ type: 'info', message: 'Ingresa el nombre de la skill.' });
      return;
    }

    const existing = availableSkills.find(
      (skill) => skill.name.toLowerCase() === normalized.toLowerCase(),
    );

    if (existing) {
      addRequiredSkill(existing.name);
      setNewSkillName('');
      setRequestFeedback({ type: 'success', message: `Skill agregada: ${existing.name}` });
      return;
    }

    try {
      const createdSkill = await createRecruiterSkill({
        name: normalized,
        category: newSkillCategory,
      });

      const createdName = String(createdSkill?.name || normalized);
      const createdCategory = String(createdSkill?.category || newSkillCategory);

      setAvailableSkills((prev) => [
        ...prev,
        {
          id: String(createdSkill?.id || `new-${Date.now()}`),
          name: createdName,
          category: createdCategory,
        },
      ]);
      addRequiredSkill(createdName);
      setNewSkillName('');
      setRequestFeedback({ type: 'success', message: `Skill creada y agregada: ${createdName}` });
    } catch (error) {
      console.error('No fue posible crear la skill en backend, se agregara localmente al formulario', error);

      setAvailableSkills((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          name: normalized,
          category: newSkillCategory,
        },
      ]);
      addRequiredSkill(normalized);
      setNewSkillName('');
      setRequestFeedback({
        type: 'info',
        message: `Skill agregada localmente al formulario: ${normalized}`,
      });
    }
  };

  const submitRecruiterRequest = async () => {
    if (!requestPayload.title || !requestPayload.description || requestPayload.requiredSkills.length === 0) {
      setRequestFeedback({
        type: 'error',
        message: 'Completa titulo, descripcion y al menos una skill requerida.',
      });
      return;
    }

    setSubmittingRequest(true);
    setRequestFeedback(null);

    try {
      await createVacancy(requestPayload);
      await loadMyCreatedVacancies();
      await loadDashboardMetrics();
      setRequestForm(INITIAL_REQUEST_FORM);
      setSelectedVacancyId('');
      setSelectedExistingSkill('');
      setNewSkillName('');
      setRequestFeedback({ type: 'success', message: 'Vacante creada correctamente.' });
    } catch (error) {
      console.error('No se pudo crear la vacante', error);
      const backendMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message !== 'undefined'
          ? (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : null;
      const parsedMessage = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage;

      setRequestFeedback({
        type: 'error',
        message: parsedMessage || 'No se pudo crear la vacante. Revisa el endpoint /recruiter/vacancies en backend.',
      });
    } finally {
      setSubmittingRequest(false);
    }
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate: CandidateProfile) => {
      const normalizedName = appliedSearchByName.trim().toLowerCase();
      const normalizedTitle = appliedSearchByTitle.trim().toLowerCase();
      const normalizedSkill = appliedSearchBySkill.trim().toLowerCase();

      const candidateSkills = Array.isArray(candidate.skillsValidated)
        ? candidate.skillsValidated
            .filter((skill): skill is string => typeof skill === 'string')
            .map((skill) => skill.toLowerCase())
        : [];

      return (
        candidate.fullName.toLowerCase().includes(normalizedName) &&
        candidate.title.toLowerCase().includes(normalizedTitle) &&
        (normalizedSkill === '' || candidateSkills.some((skill) => skill.includes(normalizedSkill)))
      );
    });
  }, [appliedSearchByName, appliedSearchByTitle, appliedSearchBySkill, candidates]);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate: CandidateProfile) => candidate.id === selectedCandidateId) ?? null,
    [selectedCandidateId, candidates]
  );

  const selectedWorkshopCandidate = useMemo(
    () =>
      candidates.find((candidate) => candidate.id === workshopCandidateId) ?? null,
    [candidates, workshopCandidateId],
  );

  const scheduledWorkshops = useMemo(
    () =>
      academyCourses.flatMap((course) =>
        (course.meetingLinks || []).map((meetingLink) => ({
          id: meetingLink.id,
          url: meetingLink.url,
          platform: meetingLink.platform,
          notes: meetingLink.notes,
          scheduledAt: meetingLink.scheduledAt,
          createdAt: meetingLink.createdAt,
          courseId: course.id,
          courseTitle: course.title,
          courseStatus: course.status,
        })),
      ),
    [academyCourses],
  );

  const filteredScheduledWorkshops = useMemo(
    () =>
      scheduledWorkshops.filter((workshop) => {
        const matchesPlatform =
          workshopPlatformFilter === 'ALL' ||
          workshop.platform === workshopPlatformFilter;
        const matchesCourse =
          workshopCourseFilter === 'ALL' || workshop.courseId === workshopCourseFilter;

        return matchesPlatform && matchesCourse;
      }),
    [scheduledWorkshops, workshopPlatformFilter, workshopCourseFilter],
  );

  const formatWorkshopDateTime = (isoDate?: string | null): string => {
    if (!isoDate) return 'Fecha no disponible';

    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return 'Fecha no disponible';

    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getWorkshopVisualState = (courseStatus: CourseStatusType) => {
    if (courseStatus === CourseStatus.ARCHIVED) {
      return {
        label: 'Finalizado',
        color: '#9D174D',
        background: '#FCE7F3',
      };
    }

    return {
      label: 'Activo',
      color: '#1D7A3D',
      background: '#DCFCE7',
    };
  };

  const openWorkshopRoom = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyWorkshopRoomLink = async (url: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }

      setWorkshopFeedback({
        type: 'success',
        message: 'Enlace del taller copiado. Ya puedes compartirlo.',
      });
    } catch {
      setWorkshopFeedback({
        type: 'error',
        message: 'No se pudo copiar el enlace del taller.',
      });
    }
  };

  const shareWorkshopByWhatsApp = (courseTitle: string, url: string) => {
    const message = `Te comparto el taller "${courseTitle}": ${url}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank', 'noopener,noreferrer');
  };

  const shareWorkshopByEmail = (courseTitle: string, url: string) => {
    const subject = encodeURIComponent(`Invitacion al taller: ${courseTitle}`);
    const body = encodeURIComponent(
      `Hola,\n\nTe comparto el acceso al taller "${courseTitle}":\n${url}\n\nSaludos.`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const applyCandidateFilters = () => {
    setAppliedSearchByName(searchByName);
    setAppliedSearchByTitle(searchByTitle);
    setAppliedSearchBySkill(searchBySkill);
  };

  const clearCandidateFilters = () => {
    setSearchByName('');
    setSearchByTitle('');
    setSearchBySkill('');
    setAppliedSearchByName('');
    setAppliedSearchByTitle('');
    setAppliedSearchBySkill('');
    setSelectedCandidateId(null);
    setSelectedPendingCourse(null);
    setTalentDetailTab('skills');
  };

  const handleCandidateFilterEnter = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyCandidateFilters();
    }
  };

  const loadCandidateDetails = async (candidateId: string) => {
    setLoadingCandidateDetails(true);
    try {
      const details = await getCandidateConsolidatedData(candidateId);
      setSelectedCandidateDetails(details);
    } catch (error) {
      console.warn('Error loading candidate details:', error);
    } finally {
      setLoadingCandidateDetails(false);
    }

  };

  const openCandidateDetail = async (
    candidateId: string,
    tab: TalentDetailTab = 'skills',
    targetSection: string = 'Perfil Candidato',
  ) => {
    setSelectedCandidateId(candidateId);
    setTalentDetailTab(tab);
    setSelectedPendingCourse(null);
    setSelectedMenuItem(targetSection);
    await loadCandidateDetails(candidateId);
  };

  const resolveCvSkills = () => {
    const cvData = selectedCandidateDetails?.cv;
    const technicalFromParsed = cvData?.parsed?.skills?.technical || [];
    const personalFromParsed = cvData?.parsed?.skills?.personal || [];
    const technicalFromSnapshot = cvData?.snapshot?.skills?.technical || [];
    const personalFromSnapshot = cvData?.snapshot?.skills?.personal || [];
    const technical =
      technicalFromParsed.length > 0
        ? technicalFromParsed
        : technicalFromSnapshot.length > 0
          ? technicalFromSnapshot
          : cvData?.technicalSkills || [];
    const personal =
      personalFromParsed.length > 0
        ? personalFromParsed
        : personalFromSnapshot.length > 0
          ? personalFromSnapshot
          : cvData?.personalSkills || [];

    return {
      technical: technical.filter((skill) => Boolean(skill && skill.trim())),
      personal: personal.filter((skill) => Boolean(skill && skill.trim())),
    };
  };

  const renderCandidateSkillsView = (candidate: CandidateProfile) => {
    const cvSkills = resolveCvSkills();

    // Fallback: skills generales del perfil (si no hay skills clasificadas del CV)
    const skills = selectedCandidateDetails?.skills || candidate.skillsValidated;
    const fallbackSkills = Array.isArray(skills)
      ? skills
          .map((skill) => {
            if (typeof skill === 'string') {
              return skill;
            }

            if (skill && typeof skill === 'object' && 'name' in skill) {
              return String(skill.name || '');
            }

            return '';
          })
          .filter((skill): skill is string => Boolean(skill && skill.trim()))
      : [];

    const hasCategorizedSkills = cvSkills.technical.length > 0 || cvSkills.personal.length > 0;

    return (
      <Box sx={{ mt: 2.2 }}>
        <Typography sx={{ color: '#1F3E69', fontWeight: 800, mb: 1.2 }}>
          Skills Validadas del Perfil
        </Typography>
        {loadingCandidateDetails && (
          <Typography sx={{ color: '#999', fontStyle: 'italic' }}>Cargando skills...</Typography>
        )}

        {hasCategorizedSkills ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.2 }}>
            <Card sx={{ border: '1px solid #D8E3F0' }}>
              <CardContent>
                <Typography sx={{ color: '#5C6F86', fontWeight: 700, mb: 1 }}>
                  Skills Tecnicas ({cvSkills.technical.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {cvSkills.technical.length > 0 ? (
                    cvSkills.technical.map((skill, index) => (
                      <Chip
                        key={`${candidate.id}-skill-tech-${skill}-${index}`}
                        label={skill}
                        size="small"
                        sx={{ bgcolor: '#E3F2FD', color: '#1565C0' }}
                      />
                    ))
                  ) : (
                    <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>
                      Sin skills tecnicas registradas
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ border: '1px solid #D8E3F0' }}>
              <CardContent>
                <Typography sx={{ color: '#5C6F86', fontWeight: 700, mb: 1 }}>
                  Skills Psicotecnicas ({cvSkills.personal.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {cvSkills.personal.length > 0 ? (
                    cvSkills.personal.map((skill, index) => (
                      <Chip
                        key={`${candidate.id}-skill-psy-${skill}-${index}`}
                        label={skill}
                        size="small"
                        sx={{ bgcolor: '#F3E5F5', color: '#6A1B9A' }}
                      />
                    ))
                  ) : (
                    <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>
                      Sin skills psicotecnicas registradas
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
            {fallbackSkills.map((skill, index) => (
              <Box
                key={`${candidate.id}-${skill}-${index}`}
                sx={{
                  p: 1.35,
                  borderRadius: 1.7,
                  border: '1px solid #D8E3F0',
                  bgcolor: '#FFFFFF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography sx={{ color: '#173A68', fontWeight: 700 }}>{skill}</Typography>
                <Chip
                  label="Validada"
                  size="small"
                  sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 700 }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const renderCandidateCvView = (candidate: CandidateProfile) => {
    // Usar datos reales si están disponibles
    const cvData = selectedCandidateDetails?.cv || null;
    const assessmentResults = selectedCandidateDetails?.assessmentResults || [];
    const technicalResult = assessmentResults.find((result) => {
      const normalizedType = String(result.type || '').toLowerCase();
      return normalizedType === 'technical';
    });
    const psychoResult = assessmentResults.find((result) => {
      const normalizedType = String(result.type || '').toLowerCase();
      return normalizedType === 'psychotechnical';
    });

    const parsedProfile = cvData?.parsed?.profile;
    const snapshotProfile = cvData?.snapshot?.profile;
    const parsedExperience = cvData?.parsed?.experience || cvData?.snapshot?.experience || [];
    const parsedEducation = cvData?.parsed?.education || cvData?.snapshot?.education || [];
    const coursesFromApi = selectedCandidateDetails?.courses || [];

    const currentCourses =
      coursesFromApi.filter((course) =>
        course.status === 'in_progress' || course.status === 'pending',
      );
    const completedCourses =
      coursesFromApi.filter((course) => course.status === 'completed');

    const fallbackCurrentCourses = candidate.pendingCourses || [];
    const fallbackCompletedCourses = candidate.approvedCourses || [];

    const cvSummary =
      parsedProfile?.summary ||
      parsedProfile?.professionalSummary ||
      snapshotProfile?.professionalSummary ||
      cvData?.summary ||
      candidate.cvSummary ||
      (cvData?.fileName ? `CV cargado: ${cvData.fileName}` : 'CV no disponible aún');
    const technicalScore = technicalResult?.score || candidate.technicalResult.scorePct;
    const technicalFeedback = technicalResult?.feedback || candidate.technicalResult.feedback;
    const psychoScore = psychoResult?.score || candidate.psychotechnicalResult.scorePct;
    const psychoFeedback = psychoResult?.feedback || candidate.psychotechnicalResult.feedback;

    return (
      <Box sx={{ mt: 2.2, display: 'grid', gap: 1.5 }}>
        {loadingCandidateDetails && (
          <Paper sx={{ p: 1.5, bgcolor: '#E3F2FD', border: '1px solid #BBDEFB' }}>
            <Typography sx={{ color: '#1565C0', fontWeight: 600 }}>
              Cargando datos del candidato...
            </Typography>
          </Paper>
        )}

        <Card sx={{ border: '1px solid #D8E3F0' }}>
          <CardContent>
            <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 1 }}>CV / Living Profile</Typography>
            <Typography sx={{ color: '#304965' }}>{cvSummary}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ border: '1px solid #D8E3F0' }}>
          <CardContent>
            <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 1.2 }}>Ver CV Perfil Talento</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
              <Typography sx={{ color: '#5C6F86' }}>
                Nombre: <strong>{parsedProfile?.fullName || snapshotProfile?.fullName || candidate.fullName}</strong>
              </Typography>
              <Typography sx={{ color: '#5C6F86' }}>
                Titulo: <strong>{parsedProfile?.title || snapshotProfile?.title || candidate.title}</strong>
              </Typography>
              <Typography sx={{ color: '#5C6F86' }}>
                Ubicacion: <strong>{parsedProfile?.location || snapshotProfile?.location || candidate.location}</strong>
              </Typography>
              <Typography sx={{ color: '#5C6F86' }}>
                Archivo CV: <strong>{cvData?.fileName || 'No disponible'}</strong>
              </Typography>
            </Box>
            <Typography sx={{ color: '#304965', mt: 1.2 }}>
              {parsedProfile?.professionalSummary || snapshotProfile?.professionalSummary || cvSummary}
            </Typography>
            {(parsedExperience.length > 0 || parsedEducation.length > 0) && (
              <Typography sx={{ color: '#5C6F86', mt: 1, fontSize: '0.92rem' }}>
                Experiencias: {parsedExperience.length} · Estudios: {parsedEducation.length}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.2 }}>
          <Card sx={{ border: '1px solid #D8E3F0' }}>
            <CardContent>
              <Typography sx={{ color: '#5C6F86', fontWeight: 700 }}>Resultado Prueba Tecnica</Typography>
              <Typography sx={{ mt: 0.6, fontSize: '2rem', fontWeight: 800, color: '#1565C0' }}>
                {technicalScore || '-'}%
              </Typography>
              <Typography sx={{ mt: 0.6, color: '#304965' }}>
                {technicalFeedback || 'Aún sin completar'}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ border: '1px solid #D8E3F0' }}>
            <CardContent>
              <Typography sx={{ color: '#5C6F86', fontWeight: 700 }}>Resultado Prueba Psicotecnicas</Typography>
              <Typography sx={{ mt: 0.6, fontSize: '2rem', fontWeight: 800, color: '#6A1B9A' }}>
                {psychoScore || '-'}%
              </Typography>
              <Typography sx={{ mt: 0.6, color: '#304965' }}>
                {psychoFeedback || 'Aún sin completar'}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {parsedExperience.length > 0 && (
          <Card sx={{ border: '1px solid #D8E3F0' }}>
            <CardContent>
              <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 1 }}>Experiencia Laboral</Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                {parsedExperience.map((exp, idx: number) => (
                    <Box key={idx} sx={{ p: 1, bgcolor: '#F8FBFF', border: '1px solid #D8E3F0', borderRadius: 1 }}>
                      <Typography sx={{ fontWeight: 700, color: '#173A68' }}>
                        {exp.position || 'Sin cargo'}
                      </Typography>
                      <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>
                        {(exp.company || 'Empresa no especificada')} · {(exp.startDate || 'N/A')} a {(exp.endDate || 'Actualidad')}
                      </Typography>
                      {exp.description && (
                        <Typography sx={{ color: '#304965', fontSize: '0.9rem', mt: 0.6 }}>
                          {exp.description}
                        </Typography>
                      )}
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {parsedEducation.length > 0 && (
          <Card sx={{ border: '1px solid #D8E3F0' }}>
            <CardContent>
              <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 1 }}>Estudios</Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                {parsedEducation.map((education, idx: number) => (
                  <Box
                    key={`education-${idx}`}
                    sx={{ p: 1, bgcolor: '#F8FBFF', border: '1px solid #D8E3F0', borderRadius: 1 }}
                  >
                    <Typography sx={{ fontWeight: 700, color: '#173A68' }}>
                      {education.degree || 'Grado no especificado'}
                    </Typography>
                    <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>
                      {education.institution || 'Institucion no especificada'}
                      {education.status ? ` · ${education.status}` : ''}
                    </Typography>
                    {education.details && (
                      <Typography sx={{ color: '#304965', fontSize: '0.9rem', mt: 0.6 }}>
                        {education.details}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {candidate.roadmapRecommended.length > 0 && (
          <Card sx={{ border: '1px solid #D8E3F0' }}>
            <CardContent>
              <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 1 }}>Roadmap Recomendado</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {candidate.roadmapRecommended.map((item) => (
                  <Chip
                    key={`${candidate.id}-roadmap-${item}`}
                    label={item}
                    sx={{ bgcolor: '#EDF4FF', color: '#1F3E69' }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {(currentCourses.length > 0 || fallbackCurrentCourses.length > 0) && (
          <Card sx={{ border: '1px solid #D8E3F0' }}>
            <CardContent>
              <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 1 }}>Cursos Actuales</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {(currentCourses.length > 0
                  ? currentCourses.map((course) => {
                    const courseTitle = course.title || 'Curso sin titulo';
                    const courseProgress =
                      typeof course.progress === 'number' ? ` (${course.progress}%)` : '';
                    return `${courseTitle}${courseProgress}`;
                  })
                  : fallbackCurrentCourses
                ).map((course) => (
                  <Button
                    key={`${candidate.id}-pending-${course}`}
                    variant={selectedPendingCourse === course ? 'contained' : 'outlined'}
                    onClick={() => setSelectedPendingCourse(course)}
                    sx={{
                      textTransform: 'none',
                      borderColor: '#1F3E69',
                      color: selectedPendingCourse === course ? '#fff' : '#1F3E69',
                      bgcolor: selectedPendingCourse === course ? '#173A68' : 'transparent',
                      '&:hover': { bgcolor: selectedPendingCourse === course ? '#112D51' : '#EDF4FF' },
                    }}
                  >
                    {course}
                  </Button>
                ))}
              </Box>

              {selectedPendingCourse && (
                <Box sx={{ mt: 1.6 }}>
                  <Divider sx={{ mb: 1.4 }} />
                  <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 1 }}>
                    Cursos Realizados (relacionados con {selectedPendingCourse})
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 0.8 }}>
                    {(completedCourses.length > 0
                      ? completedCourses.map((course) => course.title || 'Curso sin titulo')
                      : fallbackCompletedCourses
                    ).map((course) => (
                      <Box
                        key={`${candidate.id}-approved-${course}`}
                        sx={{
                          p: 1.1,
                          border: '1px solid #D8E3F0',
                          borderRadius: 1.5,
                          bgcolor: '#F8FBFF',
                          color: '#1F3E69',
                          fontWeight: 700,
                        }}
                      >
                        {course}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  const renderSelectedCandidateBlock = (candidate: CandidateProfile) => (
    <Paper sx={{ mt: 2.2, p: 2.2, borderRadius: 2, border: '1px solid #C9D7E8', bgcolor: '#F8FBFF' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, color: '#173A68', fontSize: '1.1rem' }}>{candidate.fullName}</Typography>
          <Typography sx={{ color: '#415B78', mt: 0.25 }}>
            {candidate.title} · {candidate.location}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={talentDetailTab === 'skills' ? 'contained' : 'outlined'}
            onClick={() => {
              setTalentDetailTab('skills');
              setSelectedMenuItem('Skills Validadas');
            }}
            sx={{
              textTransform: 'none',
              borderColor: '#173A68',
              color: talentDetailTab === 'skills' ? '#fff' : '#173A68',
              bgcolor: talentDetailTab === 'skills' ? '#173A68' : 'transparent',
              '&:hover': { bgcolor: talentDetailTab === 'skills' ? '#112D51' : '#EDF4FF' },
            }}
          >
            Skills Validadas
          </Button>
          <Button
            variant={talentDetailTab === 'cv' ? 'contained' : 'outlined'}
            onClick={() => {
              setTalentDetailTab('cv');
              setSelectedMenuItem('CV / Living Profile');
            }}
            sx={{
              textTransform: 'none',
              borderColor: '#173A68',
              color: talentDetailTab === 'cv' ? '#fff' : '#173A68',
              bgcolor: talentDetailTab === 'cv' ? '#173A68' : 'transparent',
              '&:hover': { bgcolor: talentDetailTab === 'cv' ? '#112D51' : '#EDF4FF' },
            }}
          >
            CV + Resultados
          </Button>
        </Box>
      </Box>

      {talentDetailTab === 'skills' ? renderCandidateSkillsView(candidate) : renderCandidateCvView(candidate)}
    </Paper>
  );

  const renderCandidateProfileSection = () => (
    <Paper
      sx={{
        p: { xs: 2.4, md: 3.2 },
        borderRadius: 3,
        minHeight: 420,
        boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
      }}
    >
      <Typography sx={{ fontSize: { xs: '1.45rem', md: '1.8rem' }, fontWeight: 800, color: '#1F3E69' }}>
        Perfil del Candidato
      </Typography>
      <Typography sx={{ mt: 0.7, color: '#5C6F86' }}>
        Busca por nombre, cargo o skill para ubicar candidatos y abrir su detalle completo.
      </Typography>

      {loadingCandidates && (
        <Paper sx={{ mt: 2.2, p: 1.5, bgcolor: '#E3F2FD', border: '1px solid #BBDEFB' }}>
          <Typography sx={{ color: '#1565C0', fontWeight: 600 }}>
            Cargando candidatos...
          </Typography>
        </Paper>
      )}

      {candidatesError && (
        <Paper sx={{ mt: 2.2, p: 1.5, bgcolor: '#FFEBEE', border: '1px solid #FFCDD2' }}>
          <Typography sx={{ color: '#C62828', fontWeight: 600 }}>
            Error al cargar candidatos: {candidatesError}
          </Typography>
        </Paper>
      )}

      <Box sx={{ mt: 2.2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.2 }}>
        <TextField
          label="Buscar por nombre"
          size="small"
          value={searchByName}
          onChange={(event) => setSearchByName(event.target.value)}
          onKeyDown={handleCandidateFilterEnter}
        />
        <TextField
          label="Buscar por cargo"
          size="small"
          value={searchByTitle}
          onChange={(event) => setSearchByTitle(event.target.value)}
          onKeyDown={handleCandidateFilterEnter}
        />
        <TextField
          label="Buscar por skill"
          size="small"
          value={searchBySkill}
          onChange={(event) => setSearchBySkill(event.target.value)}
          onKeyDown={handleCandidateFilterEnter}
        />
      </Box>

      <Box sx={{ mt: 1.3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={applyCandidateFilters}
          sx={{
            bgcolor: '#173A68',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': { bgcolor: '#112D51' },
          }}
        >
          Buscar
        </Button>
        <Button
          variant="outlined"
          onClick={clearCandidateFilters}
          sx={{
            borderColor: '#173A68',
            color: '#173A68',
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': { borderColor: '#112D51', bgcolor: '#EDF4FF' },
          }}
        >
          Limpiar busquedas
        </Button>
      </Box>

      <Typography sx={{ mt: 1.4, color: '#173A68', fontWeight: 700 }}>
        Resultados: {filteredCandidates.length}
      </Typography>

      <Box sx={{ mt: 1.4, display: 'grid', gap: 1.1 }}>
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map((candidate) => (
            <Card key={candidate.id} sx={{ border: '1px solid #D8E3F0', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: '#173A68', fontSize: '1.04rem' }}>
                      {candidate.fullName}
                    </Typography>
                    <Typography sx={{ color: '#415B78', mt: 0.2 }}>{candidate.title}</Typography>
                  </Box>

                  <Button
                    variant="contained"
                    onClick={() => openCandidateDetail(candidate.id, 'skills')}
                    sx={{
                      bgcolor: '#173A68',
                      color: '#fff',
                      fontWeight: 700,
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#112D51' },
                    }}
                  >
                    Mostrar detalle
                  </Button>
                </Box>

                <Box sx={{ mt: 1.2, display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {candidate.skillsValidated
                    .filter((skill) => Boolean(skill && skill.trim()))
                    .slice(0, 6)
                    .map((skill, index) => (
                    <Chip
                      key={`${candidate.id}-skill-preview-${skill}-${index}`}
                      label={skill}
                      size="small"
                      sx={{ bgcolor: '#EEF4FF', color: '#1F3E69' }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))
        ) : (
          <Paper sx={{ p: 2, border: '1px solid #FFB74D', bgcolor: '#FFF3E0' }}>
            <Typography sx={{ color: '#E65100', fontWeight: 700 }}>
              No encontramos candidatos con esos criterios de busqueda.
            </Typography>
          </Paper>
        )}
      </Box>

      {selectedCandidate && renderSelectedCandidateBlock(selectedCandidate)}
    </Paper>
  );

  const renderSkillsValidatedSection = () => {
    if (!selectedCandidate) {
      return (
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, boxShadow: '0px 3px 10px rgba(11,38,69,0.08)' }}>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#1F3E69' }}>
            Skills Validadas
          </Typography>
          <Typography sx={{ mt: 1, color: '#5C6F86' }}>
            Primero selecciona un candidato en la seccion Perfil Candidato para visualizar sus skills validadas.
          </Typography>
          <Button
            variant="contained"
            onClick={() => setSelectedMenuItem('Perfil Candidato')}
            sx={{ mt: 2, bgcolor: '#173A68', '&:hover': { bgcolor: '#112D51' } }}
          >
            Ir a Perfil Candidato
          </Button>
        </Paper>
      );
    }

    return (
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, boxShadow: '0px 3px 10px rgba(11,38,69,0.08)' }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#1F3E69' }}>
          Skills Validadas - {selectedCandidate.fullName}
        </Typography>
        {renderCandidateSkillsView(selectedCandidate)}
      </Paper>
    );
  };

  const renderCvLivingProfileSection = () => {
    if (!selectedCandidate) {
      return (
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, boxShadow: '0px 3px 10px rgba(11,38,69,0.08)' }}>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#1F3E69' }}>
            CV / Living Profile
          </Typography>
          <Typography sx={{ mt: 1, color: '#5C6F86' }}>
            Selecciona un candidato en Perfil Candidato para revisar su CV, resultados y roadmap.
          </Typography>
          <Button
            variant="contained"
            onClick={() => setSelectedMenuItem('Perfil Candidato')}
            sx={{ mt: 2, bgcolor: '#173A68', '&:hover': { bgcolor: '#112D51' } }}
          >
            Ir a Perfil Candidato
          </Button>
        </Paper>
      );
    }

    return (
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, boxShadow: '0px 3px 10px rgba(11,38,69,0.08)' }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#1F3E69' }}>
          CV / Living Profile - {selectedCandidate.fullName}
        </Typography>
        {renderCandidateCvView(selectedCandidate)}
      </Paper>
    );
  };

  const renderCoursesCompletedSection = () => {
    if (!selectedCandidate) {
      return (
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, boxShadow: '0px 3px 10px rgba(11,38,69,0.08)' }}>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#1F3E69' }}>
            Cursos Realizados
          </Typography>
          <Typography sx={{ mt: 1, color: '#5C6F86' }}>
            Selecciona un candidato desde Perfil Candidato para ver el historial de cursos aprobados.
          </Typography>
          <Button
            variant="contained"
            onClick={() => setSelectedMenuItem('Perfil Candidato')}
            sx={{ mt: 2, bgcolor: '#173A68', '&:hover': { bgcolor: '#112D51' } }}
          >
            Ir a Perfil Candidato
          </Button>
        </Paper>
      );
    }

    const coursesFromApi = selectedCandidateDetails?.courses || [];
    const completedCourses = coursesFromApi.filter(
      (course) => course.status === 'completed',
    );
    const fallbackCompletedCourses = selectedCandidate.approvedCourses || [];

    return (
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, boxShadow: '0px 3px 10px rgba(11,38,69,0.08)' }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#1F3E69' }}>
          Cursos Realizados - {selectedCandidate.fullName}
        </Typography>
        <Typography sx={{ mt: 1, color: '#5C6F86' }}>
          Historial de cursos aprobados por el candidato seleccionado.
        </Typography>
        <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
          {(completedCourses.length > 0
            ? completedCourses.map((course) => course.title || 'Curso sin titulo')
            : fallbackCompletedCourses
          ).map((course) => (
            <Box
              key={`${selectedCandidate.id}-course-approved-${course}`}
              sx={{ p: 1.2, border: '1px solid #D8E3F0', borderRadius: 1.6, bgcolor: '#F8FBFF' }}
            >
              <Typography sx={{ color: '#1F3E69', fontWeight: 700 }}>{course}</Typography>
            </Box>
          ))}

          {completedCourses.length === 0 && fallbackCompletedCourses.length === 0 && (
            <Typography sx={{ color: '#5C6F86', fontStyle: 'italic' }}>
              Este candidato aun no tiene cursos aprobados.
            </Typography>
          )}
        </Box>
      </Paper>
    );
  };

  const renderCreateRequestSection = () => (
    <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, boxShadow: '0px 3px 10px rgba(11,38,69,0.08)' }}>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#1F3E69' }}>
        Crear Solicitud
      </Typography>
      <Typography sx={{ mt: 1, color: '#5C6F86', maxWidth: 860 }}>
        Completa los campos para crear la solicitud. Las skills se cargan desde su endpoint; si una skill no existe,
        se crea automaticamente usando el endpoint de agregar skill.
      </Typography>

      {requestFeedback && (
        <Alert severity={requestFeedback.type} sx={{ mt: 2 }}>
          {requestFeedback.message}
        </Alert>
      )}

      <Box sx={{ mt: 2.2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.2 }}>
        <TextField
          select
          label={loadingVacancies ? 'Cargando vacantes...' : 'Cargar vacante existente'}
          value={selectedVacancyId}
          onChange={(event) => {
            const vacancyId = event.target.value;
            setSelectedVacancyId(vacancyId);

            if (!vacancyId) {
              setRequestForm(INITIAL_REQUEST_FORM);
              return;
            }

            const selectedVacancy = myVacancies.find(
              (vacancy) => vacancy.id === vacancyId,
            );
            if (!selectedVacancy) return;

            setRequestForm({
              ...INITIAL_REQUEST_FORM,
              title: selectedVacancy.title || '',
              description: selectedVacancy.description || '',
              location: selectedVacancy.location || '',
              modality: normalizeModality(selectedVacancy.modality),
              requiredSkills: selectedVacancy.requiredSkills || [],
            });
          }}
          helperText="Selecciona una vacante para cargar datos en el formulario"
        >
          <MenuItem value="">Nueva solicitud vacia</MenuItem>
          {myVacancies.map((vacancy) => (
            <MenuItem key={vacancy.id} value={vacancy.id}>
              {vacancy.title}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Titulo de la vacante"
          value={requestForm.title}
          onChange={(event) => setRequestForm((prev) => ({ ...prev, title: event.target.value }))}
        />
        <TextField
          label="Area"
          value={requestForm.area}
          onChange={(event) => setRequestForm((prev) => ({ ...prev, area: event.target.value }))}
        />

        <TextField
          select
          label="Modalidad"
          value={requestForm.modality}
          onChange={(event) => setRequestForm((prev) => ({ ...prev, modality: event.target.value as RecruiterRequestFormState['modality'] }))}
        >
          <MenuItem value="remote">Remote</MenuItem>
          <MenuItem value="hybrid">Hybrid</MenuItem>
          <MenuItem value="onsite">Onsite</MenuItem>
        </TextField>

        <TextField
          label="Ubicacion"
          value={requestForm.location}
          onChange={(event) => setRequestForm((prev) => ({ ...prev, location: event.target.value }))}
        />

        <TextField
          select
          label="Tipo de contrato"
          value={requestForm.contractType}
          onChange={(event) => setRequestForm((prev) => ({ ...prev, contractType: event.target.value as RecruiterRequestFormState['contractType'] }))}
        >
          <MenuItem value="full-time">Full-time</MenuItem>
          <MenuItem value="part-time">Part-time</MenuItem>
          <MenuItem value="contractor">Contractor</MenuItem>
          <MenuItem value="internship">Internship</MenuItem>
        </TextField>

        <TextField
          select
          label="Seniority"
          value={requestForm.seniority}
          onChange={(event) => setRequestForm((prev) => ({ ...prev, seniority: event.target.value as RecruiterRequestFormState['seniority'] }))}
        >
          <MenuItem value="junior">Junior</MenuItem>
          <MenuItem value="mid">Mid</MenuItem>
          <MenuItem value="senior">Senior</MenuItem>
          <MenuItem value="lead">Lead</MenuItem>
        </TextField>

        <TextField
          label="Vacantes"
          type="number"
          value={requestForm.vacancies}
          onChange={(event) =>
            setRequestForm((prev) => ({
              ...prev,
              vacancies: Math.max(1, Number(event.target.value) || 1),
            }))
          }
        />

        <TextField
          label="Salario minimo"
          type="number"
          value={requestForm.salaryMin}
          onChange={(event) => setRequestForm((prev) => ({ ...prev, salaryMin: event.target.value }))}
        />
        <TextField
          label="Salario maximo"
          type="number"
          value={requestForm.salaryMax}
          onChange={(event) => setRequestForm((prev) => ({ ...prev, salaryMax: event.target.value }))}
        />
      </Box>

      <Box sx={{ mt: 1.2, display: 'grid', gap: 1.2 }}>
        <TextField
          label="Descripcion"
          multiline
          minRows={3}
          value={requestForm.description}
          onChange={(event) => setRequestForm((prev) => ({ ...prev, description: event.target.value }))}
        />
        <TextField
          label="Responsabilidades (1 por linea)"
          multiline
          minRows={3}
          value={requestForm.responsibilitiesText}
          onChange={(event) => setRequestForm((prev) => ({ ...prev, responsibilitiesText: event.target.value }))}
        />
      </Box>

      <Card sx={{ mt: 2, border: '1px solid #D8E3F0' }}>
        <CardContent>
          <Typography sx={{ fontWeight: 800, color: '#1F3E69' }}>Skills requeridas</Typography>

          {loadingSkills && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography sx={{ color: '#5C6F86' }}>Cargando skills...</Typography>
            </Box>
          )}

          <Box sx={{ mt: 1.2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 1 }}>
            <TextField
              select
              label="Seleccionar skill existente"
              value={selectedExistingSkill}
              onChange={(event) => setSelectedExistingSkill(event.target.value)}
            >
              <MenuItem value="">Selecciona una skill</MenuItem>
              {availableSkills.map((skill) => (
                <MenuItem key={`${skill.id}-${skill.name}`} value={skill.name}>
                  {skill.name} ({skill.category})
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              onClick={() => {
                addRequiredSkill(selectedExistingSkill);
                setSelectedExistingSkill('');
              }}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Agregar skill existente
            </Button>
          </Box>

          <Box sx={{ mt: 1.2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 180px auto' }, gap: 1 }}>
            <TextField
              label="Nueva skill"
              value={newSkillName}
              onChange={(event) => setNewSkillName(event.target.value)}
            />
            <TextField
              select
              label="Categoria"
              value={newSkillCategory}
              onChange={(event) => setNewSkillCategory(event.target.value)}
            >
              <MenuItem value="technical">Technical</MenuItem>
              <MenuItem value="personal">Personal</MenuItem>
              <MenuItem value="general">General</MenuItem>
            </TextField>
            <Button
              variant="contained"
              onClick={addNewSkillIfNeeded}
              sx={{ bgcolor: '#173A68', '&:hover': { bgcolor: '#112D51' }, textTransform: 'none', fontWeight: 700 }}
            >
              Crear y agregar
            </Button>
          </Box>

          <Box sx={{ mt: 1.4, display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
            {requestForm.requiredSkills.length > 0 ? (
              requestForm.requiredSkills.map((skill) => (
                <Chip
                  key={`required-${skill}`}
                  label={skill}
                  onDelete={() => removeRequiredSkill(skill)}
                  sx={{ bgcolor: '#EEF4FF', color: '#1F3E69' }}
                />
              ))
            ) : (
              <Typography sx={{ color: '#5C6F86' }}>Aun no hay skills requeridas.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mt: 1.2 }}>
        <TextField
          label="Skills opcionales (1 por linea)"
          multiline
          minRows={3}
          fullWidth
          value={requestForm.optionalSkillsText}
          onChange={(event) => setRequestForm((prev) => ({ ...prev, optionalSkillsText: event.target.value }))}
        />
      </Box>

      <Card sx={{ mt: 2, border: '1px dashed #B3C7DD', bgcolor: '#F8FBFF' }}>
        <CardContent>
          <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 1 }}>JSON de la solicitud</Typography>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.2,
              bgcolor: '#FFFFFF',
              border: '1px solid #D8E3F0',
              borderRadius: 1,
              color: '#1F3E69',
              overflowX: 'auto',
              fontSize: '0.8rem',
            }}
          >
            {JSON.stringify(requestPayload, null, 2)}
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={submitRecruiterRequest}
          disabled={submittingRequest}
          sx={{ bgcolor: '#173A68', '&:hover': { bgcolor: '#112D51' }, textTransform: 'none', fontWeight: 700 }}
        >
          {submittingRequest ? 'Creando...' : 'Crear Solicitud'}
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setRequestForm(INITIAL_REQUEST_FORM);
            setSelectedVacancyId('');
            setSelectedExistingSkill('');
            setNewSkillName('');
            setRequestFeedback(null);
          }}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Limpiar formulario
        </Button>
      </Box>
    </Paper>
  );

  const renderMyRequestsSection = () => {
    const tableVacancies = myVacancies.map((vacancy) => ({
      id: vacancy.id,
      title: vacancy.title,
      modality: vacancy.modality || 'N/A',
      location: vacancy.location || 'N/A',
    }));

    return (
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, boxShadow: '0px 3px 10px rgba(11,38,69,0.08)' }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#1F3E69' }}>
          Mis Solicitudes
        </Typography>
        <Typography sx={{ mt: 1, color: '#5C6F86', mb: 2 }}>
          Selecciona una vacante para ver sus candidatos preseleccionados.
        </Typography>

        {loadingVacancies ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={18} />
            <Typography sx={{ color: '#5C6F86' }}>Cargando vacantes...</Typography>
          </Box>
        ) : tableVacancies.length > 0 ? (
          <VacancyTable
            vacancies={tableVacancies}
            onSelectVacancy={(id) => {
              setSelectedVacancyId(id);
              void handleMenuSelection('Candidatos Preseleccionados', id);
            }}
          />
        ) : (
          <Alert severity="info">Aun no tienes vacantes creadas.</Alert>
        )}
      </Paper>
    );
  };

  const renderPipelineCandidateCard = (
    candidate: VacancyPipelineCandidate,
    actionLabel: string,
    action: 'selected' | 'finalist' | 'accepted',
  ) => {
    const isUpdating = updatingCandidateId === candidate.id;

    return (
      <Card key={`${action}-${candidate.id}`} sx={{ border: '1px solid #D8E3F0', borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#173A68', fontSize: '1.04rem' }}>
                {candidate.fullName}
              </Typography>
              <Typography sx={{ color: '#415B78', mt: 0.2 }}>
                {candidate.title} · {candidate.location}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={() => openCandidateDetail(candidate.id, 'skills', selectedMenuItem || 'Perfil Candidato')}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Ver detalle
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  void updateCandidateStage(candidate.id, action);
                }}
                disabled={isUpdating}
                sx={{
                  bgcolor: '#173A68',
                  color: '#fff',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#112D51' },
                }}
              >
                {isUpdating ? 'Actualizando...' : actionLabel}
              </Button>
            </Box>
          </Box>

          <Typography sx={{ mt: 1.1, color: '#173A68', fontWeight: 700, fontSize: '0.92rem' }}>
            Skills que hacen match: {candidate.matchCount}
          </Typography>
          <Box sx={{ mt: 0.8, display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {candidate.matchedSkills.map((skill) => (
              <Chip
                key={`${action}-match-${candidate.id}-${skill}`}
                label={skill}
                size="small"
                sx={{ bgcolor: '#E6FFEF', color: '#1D7A3D' }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderPreselectedCandidatesSection = () => {
    return (
      <Paper
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 3,
          minHeight: 260,
          boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
        }}
      >
        <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' }, fontWeight: 800, color: '#1F3E69' }}>
          Candidatos Preseleccionados
        </Typography>
        <Typography sx={{ mt: 1.2, color: '#5C6F86' }}>
          {selectedVacancy
            ? `Vacante seleccionada: ${selectedVacancy.title}`
            : 'Selecciona una vacante en Mis Solicitudes para ver sus preseleccionados.'}
        </Typography>

        {pipelineFeedback && (
          <Alert severity={pipelineFeedback.type} sx={{ mt: 1.4 }}>
            {pipelineFeedback.message}
          </Alert>
        )}

        {selectedVacancy && (
          <Box sx={{ mt: 1.5, display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
            {(selectedVacancy.requiredSkills || []).length > 0 ? (
              selectedVacancy.requiredSkills.map((skill) => (
                <Chip
                  key={`vacancy-required-${selectedVacancy.id}-${skill}`}
                  label={skill}
                  size="small"
                  sx={{ bgcolor: '#EEF4FF', color: '#1F3E69' }}
                />
              ))
            ) : (
              <Alert severity="info" sx={{ mt: 1, width: '100%' }}>
                Esta vacante no tiene skills requeridas configuradas.
              </Alert>
            )}
          </Box>
        )}

        {selectedVacancy && (selectedVacancy.requiredSkills || []).length > 0 && (
          <Box sx={{ mt: 2, display: 'grid', gap: 1.1 }}>
            {loadingVacancyPipeline ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} />
                <Typography sx={{ color: '#5C6F86' }}>Cargando pipeline de candidatos...</Typography>
              </Box>
            ) : vacancyPipeline?.preselected && vacancyPipeline.preselected.length > 0 ? (
              vacancyPipeline.preselected.map((candidate) =>
                renderPipelineCandidateCard(
                  candidate,
                  'Seleccionar',
                  'selected',
                ),
              )
            ) : (
              <Alert severity="info">
                No hay candidatos con al menos una skill que coincida con la vacante seleccionada.
              </Alert>
            )}
          </Box>
        )}

        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setSelectedMenuItem('Mis Solicitudes');
              void loadMyCreatedVacancies();
            }}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Volver a Mis Solicitudes
          </Button>
        </Box>
      </Paper>
    );
  };

  const renderSelectedCandidatesSection = () => (
    <Paper
      sx={{
        p: { xs: 3, md: 5 },
        borderRadius: 3,
        minHeight: 260,
        boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
      }}
    >
      <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' }, fontWeight: 800, color: '#1F3E69' }}>
        Candidatos Seleccionados
      </Typography>
      <Typography sx={{ mt: 1.2, color: '#5C6F86' }}>
        {selectedVacancy
          ? `Vacante seleccionada: ${selectedVacancy.title}`
          : 'Selecciona una vacante en Mis Solicitudes para ver seleccionados.'}
      </Typography>

      {pipelineFeedback && (
        <Alert severity={pipelineFeedback.type} sx={{ mt: 1.4 }}>
          {pipelineFeedback.message}
        </Alert>
      )}

      <Box sx={{ mt: 2, display: 'grid', gap: 1.1 }}>
        {loadingVacancyPipeline ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={18} />
            <Typography sx={{ color: '#5C6F86' }}>Cargando candidatos seleccionados...</Typography>
          </Box>
        ) : vacancyPipeline?.selected && vacancyPipeline.selected.length > 0 ? (
          vacancyPipeline.selected.map((candidate) =>
            renderPipelineCandidateCard(
              candidate,
              'Pasar a Finalista',
              'finalist',
            ),
          )
        ) : (
          <Alert severity="info">Aun no hay candidatos en la etapa Seleccionados.</Alert>
        )}
      </Box>
    </Paper>
  );

  const renderFinalistsSection = () => {
    const acceptedCount = vacancyPipeline?.accepted?.length || 0;
    const vacanciesLimit = vacancyPipeline?.vacanciesLimit || selectedVacancy?.vacancies || 1;

    return (
      <Paper
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 3,
          minHeight: 260,
          boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
        }}
      >
        <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' }, fontWeight: 800, color: '#1F3E69' }}>
          Finalistas
        </Typography>
        <Typography sx={{ mt: 1.2, color: '#5C6F86' }}>
          {selectedVacancy
            ? `Vacante seleccionada: ${selectedVacancy.title}`
            : 'Selecciona una vacante para gestionar finalistas.'}
        </Typography>

        <Alert severity="info" sx={{ mt: 1.4 }}>
          Aceptados: {acceptedCount} / {vacanciesLimit}. Puedes aceptar menos o igual al número de vacantes, nunca más.
        </Alert>

        {pipelineFeedback && (
          <Alert severity={pipelineFeedback.type} sx={{ mt: 1.4 }}>
            {pipelineFeedback.message}
          </Alert>
        )}

        <Box sx={{ mt: 2, display: 'grid', gap: 1.1 }}>
          {loadingVacancyPipeline ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography sx={{ color: '#5C6F86' }}>Cargando candidatos finalistas...</Typography>
            </Box>
          ) : vacancyPipeline?.finalists && vacancyPipeline.finalists.length > 0 ? (
            vacancyPipeline.finalists.map((candidate) =>
              renderPipelineCandidateCard(
                candidate,
                'Reclutar',
                'accepted',
              ),
            )
          ) : (
            <Alert severity="info">Aun no hay candidatos en la etapa Finalistas.</Alert>
          )}
        </Box>

        <Typography sx={{ mt: 3, mb: 1, fontWeight: 800, color: '#173A68' }}>
          Candidatos Aceptados
        </Typography>
        <Box sx={{ display: 'grid', gap: 1 }}>
          {vacancyPipeline?.accepted && vacancyPipeline.accepted.length > 0 ? (
            vacancyPipeline.accepted.map((candidate) => (
              <Card key={`accepted-${candidate.id}`} sx={{ border: '1px solid #CDE7D8', borderRadius: 2 }}>
                <CardContent>
                  <Typography sx={{ fontWeight: 800, color: '#1D7A3D' }}>{candidate.fullName}</Typography>
                  <Typography sx={{ color: '#3E6B52' }}>{candidate.title} · {candidate.location}</Typography>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography sx={{ color: '#5C6F86' }}>Aun no hay candidatos aceptados.</Typography>
          )}
        </Box>
      </Paper>
    );
  };

  const renderAcademyCoursesSection = () => {
    return (
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' }, fontWeight: 800, color: '#1F3E69' }}>
            Academia Pro - Cursos
          </Typography>
          <Typography sx={{ mt: 0.8, color: '#5C6F86' }}>
            Administra cursos de capacitacion para empresa y reclutamiento, con estado de publicacion, modulos y enlaces de talleres en vivo.
          </Typography>
          <Box sx={{ mt: 1.2, display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {userRoles.map((role) => (
              <Chip key={`role-${role}`} label={`Rol: ${role}`} size="small" sx={{ bgcolor: '#E8F0FB', color: '#1D4678' }} />
            ))}
          </Box>
        </Paper>

        {academyFeedback && (
          <Alert severity={academyFeedback.type === 'error' ? 'error' : academyFeedback.type === 'success' ? 'success' : 'info'}>
            {academyFeedback.message}
          </Alert>
        )}

        {!canManageAcademyCourses && (
          <Alert severity="info">
            Tu perfil no tiene permisos para gestionar cursos. Si tienes varios roles, inicia sesion con uno que incluya COMPANY, RECRUITER o ADMIN.
          </Alert>
        )}

        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 800, color: '#1F3E69' }}>Listado de cursos</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={courseFilters.published ? 'outlined' : 'contained'}
                onClick={() => setCourseFilters({ published: false })}
                sx={{ textTransform: 'none' }}
              >
                Todos
              </Button>
              <Button
                variant={courseFilters.published ? 'contained' : 'outlined'}
                onClick={() => setCourseFilters({ published: true })}
                sx={{ textTransform: 'none' }}
              >
                Publicados
              </Button>
              <Button onClick={() => void loadAcademyCourses()} sx={{ textTransform: 'none' }}>
                Recargar
              </Button>
            </Box>
          </Box>

          {loadingAcademyCourses ? (
            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : academyCourses.length === 0 ? (
            <Typography sx={{ mt: 2, color: '#5C6F86' }}>
              No hay cursos registrados para este perfil.
            </Typography>
          ) : (
            <Box sx={{ mt: 1.5, display: 'grid', gap: 1.1 }}>
              {academyCourses.map((course) => {
                const isExpanded = expandedCourseId === course.id;
                const canApprove = userRoles.includes('ADMIN') && course.status === CourseStatus.PENDING_REVIEW;

                return (
                  <Paper key={course.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #D8E3F0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, color: '#173A68' }}>{course.title}</Typography>
                        <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>
                          {course.description || 'Sin descripcion'}
                        </Typography>
                        <Box sx={{ mt: 0.8, display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                          <Chip size="small" label={`Estado: ${course.status}`} />
                          <Chip size="small" label={`Modulos: ${course.modules?.length || 0}`} />
                          <Chip size="small" label={`Talleres en vivo: ${course.meetingLinks?.length || 0}`} />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                        <Button size="small" variant="outlined" onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}>
                          {isExpanded ? 'Ocultar' : 'Gestionar'}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => void changeCourseStatus(course.id, CourseStatus.PENDING_REVIEW)}
                          disabled={savingCourseAction}
                        >
                          Enviar a revision
                        </Button>
                        {canApprove && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => void publishCourseAsAdmin(course.id)}
                            disabled={savingCourseAction}
                          >
                            Publicar
                          </Button>
                        )}
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => void removeCourseByArchiving(course.id)}
                          disabled={savingCourseAction}
                        >
                          Archivar
                        </Button>
                      </Box>
                    </Box>

                    {isExpanded && (
                      <Box sx={{ mt: 1.2, display: 'grid', gap: 1.2 }}>
                        <Divider />
                        <Typography sx={{ fontWeight: 700, color: '#1F3E69' }}>Modulos</Typography>
                        <Box sx={{ display: 'grid', gap: 0.8 }}>
                          {(course.modules || []).map((module) => (
                            <Paper key={module.id} sx={{ p: 1.1, borderRadius: 1.4, border: '1px solid #E4ECF6' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ color: '#173A68', fontWeight: 700 }}>
                                  #{module.order} {module.title}
                                </Typography>
                                <Button color="error" size="small" onClick={() => void removeModule(course.id, module.id)}>
                                  Eliminar
                                </Button>
                              </Box>
                              <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>{module.description || 'Sin descripcion'}</Typography>
                            </Paper>
                          ))}
                          {(!course.modules || course.modules.length === 0) && (
                            <Typography sx={{ color: '#5C6F86' }}>Este curso aun no tiene modulos.</Typography>
                          )}
                        </Box>

                        <Typography sx={{ fontWeight: 700, color: '#1F3E69' }}>Links de talleres</Typography>
                        <Box sx={{ display: 'grid', gap: 0.8 }}>
                          {(course.meetingLinks || []).map((meetingLink) => (
                            <Paper key={meetingLink.id} sx={{ p: 1.1, borderRadius: 1.4, border: '1px solid #E4ECF6' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ color: '#173A68', fontWeight: 700 }}>
                                  {meetingLink.platform}
                                </Typography>
                                <Button color="error" size="small" onClick={() => void removeMeetingLink(course.id, meetingLink.id)}>
                                  Eliminar
                                </Button>
                              </Box>
                              <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>{meetingLink.url}</Typography>
                            </Paper>
                          ))}
                          {(!course.meetingLinks || course.meetingLinks.length === 0) && (
                            <Typography sx={{ color: '#5C6F86' }}>Este curso aun no tiene enlaces de taller.</Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </Paper>

        {canManageAcademyCourses && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 1 }}>Nuevo curso</Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                <TextField label="Titulo" size="small" value={courseForm.title} onChange={(event) => setCourseForm((prev) => ({ ...prev, title: event.target.value }))} />
                <TextField label="Descripcion" size="small" multiline minRows={3} value={courseForm.description} onChange={(event) => setCourseForm((prev) => ({ ...prev, description: event.target.value }))} />
                <TextField select label="Estado" size="small" value={courseForm.status} onChange={(event) => setCourseForm((prev) => ({ ...prev, status: event.target.value as CourseStatusType }))}>
                  {Object.values(CourseStatus).map((status) => (
                    <MenuItem key={`create-status-${status}`} value={status}>{status}</MenuItem>
                  ))}
                </TextField>
                <Button variant="contained" onClick={() => void submitNewCourse()} disabled={savingCourseAction}>
                  Crear curso
                </Button>
              </Box>
            </Paper>

            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 1 }}>Agregar modulo</Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                <TextField select label="Curso" size="small" value={courseModuleForm.courseId} onChange={(event) => setCourseModuleForm((prev) => ({ ...prev, courseId: event.target.value }))}>
                  {academyCourses.map((course) => (
                    <MenuItem key={`module-course-${course.id}`} value={course.id}>{course.title}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Titulo modulo" size="small" value={courseModuleForm.title} onChange={(event) => setCourseModuleForm((prev) => ({ ...prev, title: event.target.value }))} />
                <TextField label="Descripcion" size="small" value={courseModuleForm.description} onChange={(event) => setCourseModuleForm((prev) => ({ ...prev, description: event.target.value }))} />
                <TextField label="Orden" size="small" type="number" value={courseModuleForm.order} onChange={(event) => setCourseModuleForm((prev) => ({ ...prev, order: Number(event.target.value) || 1 }))} />
                <TextField label="Video URL" size="small" value={courseModuleForm.videoUrl} onChange={(event) => setCourseModuleForm((prev) => ({ ...prev, videoUrl: event.target.value }))} />
                <TextField label="Doc URL" size="small" value={courseModuleForm.documentationUrl} onChange={(event) => setCourseModuleForm((prev) => ({ ...prev, documentationUrl: event.target.value }))} />
                <TextField label="Duracion (min)" size="small" type="number" value={courseModuleForm.durationMin} onChange={(event) => setCourseModuleForm((prev) => ({ ...prev, durationMin: event.target.value }))} />
                <Button variant="contained" onClick={() => void submitCourseModule()} disabled={savingCourseAction}>
                  Guardar modulo
                </Button>
              </Box>
            </Paper>

            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 1 }}>Agregar taller en vivo</Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                <TextField select label="Curso" size="small" value={courseMeetingForm.courseId} onChange={(event) => setCourseMeetingForm((prev) => ({ ...prev, courseId: event.target.value }))}>
                  {academyCourses.map((course) => (
                    <MenuItem key={`meeting-course-${course.id}`} value={course.id}>{course.title}</MenuItem>
                  ))}
                </TextField>
                <TextField label="URL" size="small" value={courseMeetingForm.url} onChange={(event) => setCourseMeetingForm((prev) => ({ ...prev, url: event.target.value }))} />
                <TextField
                  label="Fecha del taller"
                  size="small"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={courseMeetingForm.scheduledDate}
                  onChange={(event) =>
                    setCourseMeetingForm((prev) => ({
                      ...prev,
                      scheduledDate: event.target.value,
                    }))
                  }
                />
                <TextField
                  label="Hora del taller"
                  size="small"
                  type="time"
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { step: 300 },
                  }}
                  value={courseMeetingForm.scheduledTime}
                  onChange={(event) =>
                    setCourseMeetingForm((prev) => ({
                      ...prev,
                      scheduledTime: event.target.value,
                    }))
                  }
                />
                <TextField select label="Plataforma" size="small" value={courseMeetingForm.platform} onChange={(event) => setCourseMeetingForm((prev) => ({ ...prev, platform: event.target.value as MeetingPlatformType }))}>
                  {Object.values(MeetingPlatform).map((platform) => (
                    <MenuItem key={`meeting-platform-${platform}`} value={platform}>{platform}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Password (opcional)" size="small" value={courseMeetingForm.password} onChange={(event) => setCourseMeetingForm((prev) => ({ ...prev, password: event.target.value }))} />
                <TextField label="Notas" size="small" value={courseMeetingForm.notes} onChange={(event) => setCourseMeetingForm((prev) => ({ ...prev, notes: event.target.value }))} />
                <Button variant="contained" onClick={() => void submitMeetingLink()} disabled={savingCourseAction}>
                  Guardar enlace
                </Button>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>
    );
  };

  const renderWorkshopsSection = () => {
    const candidateWorkshopData = selectedCandidateDetails?.learningPath;

    return (
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' }, fontWeight: 800, color: '#1F3E69' }}>
            Academia Pro - Talleres
          </Typography>
          <Typography sx={{ mt: 0.8, color: '#5C6F86' }}>
            Gestiona talleres para talento y realiza seguimiento del avance desde perfiles de candidatos.
          </Typography>
        </Paper>

        {workshopFeedback && (
          <Alert severity={workshopFeedback.type === 'error' ? 'error' : workshopFeedback.type === 'success' ? 'success' : 'info'}>
            {workshopFeedback.message}
          </Alert>
        )}

        {canManageAcademyCourses && (
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 800, color: '#1F3E69' }}>
                Talleres programados
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <TextField
                  select
                  size="small"
                  label="Plataforma"
                  value={workshopPlatformFilter}
                  onChange={(event) =>
                    setWorkshopPlatformFilter(
                      event.target.value as 'ALL' | MeetingPlatformType,
                    )
                  }
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="ALL">Todas</MenuItem>
                  {Object.values(MeetingPlatform).map((platform) => (
                    <MenuItem key={`filter-platform-${platform}`} value={platform}>
                      {platform}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Curso"
                  value={workshopCourseFilter}
                  onChange={(event) => setWorkshopCourseFilter(event.target.value)}
                  sx={{ minWidth: 220 }}
                >
                  <MenuItem value="ALL">Todos los cursos</MenuItem>
                  {academyCourses.map((course) => (
                    <MenuItem key={`filter-course-${course.id}`} value={course.id}>
                      {course.title}
                    </MenuItem>
                  ))}
                </TextField>

                <Button variant="outlined" onClick={() => void loadAcademyCourses()} sx={{ textTransform: 'none' }}>
                  Recargar talleres
                </Button>
              </Box>
            </Box>

            {loadingAcademyCourses ? (
              <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : filteredScheduledWorkshops.length === 0 ? (
              <Alert severity="info" sx={{ mt: 1.2 }}>
                No hay talleres para esos filtros. Agrega enlaces en Cursos - Agregar taller en vivo o cambia los filtros.
              </Alert>
            ) : (
              <Box sx={{ mt: 1.2, display: 'grid', gap: 1 }}>
                {filteredScheduledWorkshops.map((workshop) => {
                  const workshopState = getWorkshopVisualState(workshop.courseStatus);

                  return (
                    <Paper key={`scheduled-workshop-${workshop.id}`} sx={{ p: 1.3, borderRadius: 2, border: '1px solid #D8E3F0' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: '#173A68' }}>
                            {workshop.courseTitle}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mt: 0.5 }}>
                            <Chip size="small" label={`Plataforma: ${workshop.platform}`} />
                            <Chip
                              size="small"
                              label={workshopState.label}
                              sx={{ bgcolor: workshopState.background, color: workshopState.color, fontWeight: 700 }}
                            />
                            <Chip
                              size="small"
                              label={`Programado: ${formatWorkshopDateTime(workshop.scheduledAt)}`}
                            />
                          </Box>
                          <Typography sx={{ color: '#304965', fontSize: '0.9rem', mt: 0.4 }}>
                            {workshop.url}
                          </Typography>
                          {workshop.notes && (
                            <Typography sx={{ color: '#5C6F86', fontSize: '0.85rem', mt: 0.4 }}>
                              Notas: {workshop.notes}
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                          <Button
                            variant="contained"
                            onClick={() => openWorkshopRoom(workshop.url)}
                            sx={{ textTransform: 'none', bgcolor: '#173A68', '&:hover': { bgcolor: '#112D51' } }}
                          >
                            Entrar a sala
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => void copyWorkshopRoomLink(workshop.url)}
                            sx={{ textTransform: 'none' }}
                          >
                            Copiar enlace
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => shareWorkshopByWhatsApp(workshop.courseTitle, workshop.url)}
                            sx={{ textTransform: 'none' }}
                          >
                            Compartir WhatsApp
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => shareWorkshopByEmail(workshop.courseTitle, workshop.url)}
                            sx={{ textTransform: 'none' }}
                          >
                            Compartir correo
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Paper>
        )}

        {canUseTalentWorkshops && (
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
            <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 1 }}>
              Talleres de mi perfil (rol TALENT)
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr' }, gap: 1 }}>
              <TextField label="Titulo de ruta (opcional)" size="small" value={workshopGenerateForm.title} onChange={(event) => setWorkshopGenerateForm((prev) => ({ ...prev, title: event.target.value }))} />
              <TextField label="Objetivo (opcional)" size="small" value={workshopGenerateForm.objective} onChange={(event) => setWorkshopGenerateForm((prev) => ({ ...prev, objective: event.target.value }))} />
              <Button variant="contained" onClick={() => void createOrRefreshLearningPath()} disabled={loadingWorkshops}>
                Generar / Actualizar
              </Button>
            </Box>

            {loadingWorkshops ? (
              <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={26} />
              </Box>
            ) : (
              <Box sx={{ mt: 1.2, display: 'grid', gap: 1 }}>
                {myLearningPaths.map((path) => (
                  <Paper key={path.id} sx={{ p: 1.4, borderRadius: 2, border: '1px solid #D8E3F0' }}>
                    <Typography sx={{ fontWeight: 800, color: '#173A68' }}>{path.title}</Typography>
                    <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>{path.objective || 'Sin objetivo definido'}</Typography>
                    {typeof path.confidence === 'number' && (
                      <Typography sx={{ color: '#1D4678', fontSize: '0.85rem', mt: 0.4 }}>
                        Match IA: {path.confidence}%
                      </Typography>
                    )}
                  </Paper>
                ))}

                {myLearningModules.map((module) => {
                  const progress = module.progress?.[0];
                  const status = progress?.status || 'PENDING';
                  const progressPct = progress?.progress ?? 0;

                  return (
                    <Paper key={module.id} sx={{ p: 1.4, borderRadius: 2, border: '1px solid #E4ECF6' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Box>
                          <Typography sx={{ fontWeight: 700, color: '#173A68' }}>#{module.order} {module.title}</Typography>
                          <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>{module.description || 'Sin descripcion'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Chip size="small" label={`${status} - ${progressPct}%`} />
                          <Button size="small" variant="outlined" onClick={() => void markWorkshopModuleAsCompleted(module.id)}>
                            Completar
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}

                {myLearningPaths.length === 0 && myLearningModules.length === 0 && (
                  <Typography sx={{ color: '#5C6F86' }}>
                    Todavia no tienes talleres asignados para tu perfil.
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        )}

        {canMonitorCandidateWorkshops && (
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
            <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 1 }}>
              Seguimiento de talleres por candidato
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                select
                size="small"
                label="Candidato"
                value={workshopCandidateId}
                onChange={(event) => setWorkshopCandidateId(event.target.value)}
                sx={{ minWidth: { xs: '100%', md: 360 } }}
              >
                {candidates.map((candidate) => (
                  <MenuItem key={`candidate-workshop-${candidate.id}`} value={candidate.id}>
                    {candidate.fullName} - {candidate.title}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                onClick={() => {
                  if (!workshopCandidateId) {
                    setWorkshopFeedback({
                      type: 'info',
                      message: 'Selecciona un candidato para ver su ruta de talleres.',
                    });
                    return;
                  }
                  void loadCandidateDetails(workshopCandidateId);
                }}
              >
                Ver talleres
              </Button>
            </Box>

            {selectedWorkshopCandidate && (
              <Box sx={{ mt: 1.5 }}>
                <Typography sx={{ fontWeight: 700, color: '#173A68' }}>
                  {selectedWorkshopCandidate.fullName}
                </Typography>
                <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>
                  {selectedWorkshopCandidate.title} · {selectedWorkshopCandidate.location}
                </Typography>
              </Box>
            )}

            {loadingCandidateDetails ? (
              <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : candidateWorkshopData ? (
              <Paper sx={{ mt: 1.5, p: 1.5, borderRadius: 2, border: '1px solid #D8E3F0' }}>
                <Typography sx={{ fontWeight: 800, color: '#1F3E69' }}>
                  Ruta de aprendizaje detectada
                </Typography>
                <Typography sx={{ color: '#304965', mt: 0.7 }}>
                  Estado: {candidateWorkshopData.status || 'N/A'}
                </Typography>
                <Typography sx={{ color: '#304965' }}>
                  Avance estimado: {candidateWorkshopData.progress ?? 0}%
                </Typography>
                {candidateWorkshopData.title && (
                  <Typography sx={{ color: '#304965' }}>
                    Ruta: {candidateWorkshopData.title}
                  </Typography>
                )}
              </Paper>
            ) : (
              <Typography sx={{ mt: 1.5, color: '#5C6F86' }}>
                Selecciona un candidato para consultar su informacion de talleres.
              </Typography>
            )}
          </Paper>
        )}
      </Box>
    );
  };

  const handleMenuSelection = async (item: string, vacancyIdOverride?: string) => {
    setSelectedMenuItem(item);
    const vacancyIdForPipeline = vacancyIdOverride || selectedVacancyId;

    if (item === 'Perfil Candidato') {
      await loadCandidates();
    }

    if (item === 'Skills Validadas') {
      setTalentDetailTab('skills');

      if (selectedCandidateId && !selectedCandidateDetails) {
        await loadCandidateDetails(selectedCandidateId);
      }
    }

    if (item === 'CV / Living Profile') {
      setTalentDetailTab('cv');

      if (selectedCandidateId && !selectedCandidateDetails) {
        await loadCandidateDetails(selectedCandidateId);
      }
    }

    if (item === 'Crear Solicitud') {
      await loadRequestSkills();
      await loadMyCreatedVacancies();
    }

    if (
      item === 'Mis Solicitudes' ||
      item === 'Candidatos Preseleccionados' ||
      item === 'Seleccionados' ||
      item === 'Finalistas'
    ) {
      await loadMyCreatedVacancies();

      if (
        item === 'Candidatos Preseleccionados' ||
        item === 'Seleccionados' ||
        item === 'Finalistas'
      ) {
        await loadCandidates();
        if (vacancyIdForPipeline) {
          await loadVacancyPipeline(vacancyIdForPipeline);
        }
      }
    }

    if (item === 'Cursos') {
      await loadAcademyCourses();
    }

    if (item === 'Talleres') {
      if (canManageAcademyCourses) {
        await loadAcademyCourses();
      }
      if (canMonitorCandidateWorkshops) {
        await loadCandidates();
      }
      await loadWorkshops();
    }
  };

  const handleToggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#E9EEF3', minHeight: '100vh' }}>
      <Box
        sx={{
          width: { xs: 0, md: 270 },
          display: { xs: 'none', md: 'block' },
          bgcolor: '#173A68',
          color: '#D7E3F2',
          borderRight: '1px solid #2A4F7C',
        }}
      >
        <Box sx={{ px: 3, py: 3, borderBottom: '1px solid #2A4F7C' }}>
          <Typography
            component="button"
            type="button"
            onClick={() => setSelectedMenuItem(null)}
            sx={{
              fontSize: '2rem',
              fontWeight: 800,
              color: '#F07A25',
              lineHeight: 1,
              border: 'none',
              background: 'transparent',
              p: 0,
              cursor: 'pointer',
            }}
          >
            TalentPro
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', letterSpacing: 1.2, color: '#9EB4CC', mt: 0.8 }}>
            RECLUTADORES CORPORATIVOS
          </Typography>
        </Box>

        {sidebarSections.map((section) => (
          <Box key={section.title} sx={{ borderBottom: '1px solid #274A76' }}>
            <Box
              component="button"
              type="button"
              onClick={() => handleToggleSection(section.title)}
              sx={{
                width: '100%',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                px: 3,
                py: 2,
                bgcolor: '#1D4678',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#F2F7FD' }}>{section.title}</Typography>
              <Typography
                sx={{
                  color: '#F07A25',
                  fontWeight: 700,
                  transform: openSections[section.title] ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                v
              </Typography>
            </Box>
            {openSections[section.title] && (
              <Box sx={{ py: 1.2 }}>
                {section.items.map((item) => (
                  <Box
                    key={item}
                    component="button"
                    type="button"
                    onClick={() => handleMenuSelection(item)}
                    sx={{
                      width: '100%',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: selectedMenuItem === item ? '#1D4678' : 'transparent',
                      px: 3,
                      py: 1.2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.2,
                      color: '#C9D8EA',
                    }}
                  >
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#8DA5C2' }} />
                    <Typography sx={{ fontSize: '0.98rem' }}>{item}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            height: 58,
            bgcolor: '#F8FBFF',
            borderBottom: '1px solid #D7E1EC',
            px: { xs: 2, md: 4 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Typography sx={{ fontWeight: 700, color: '#1F3557' }}>
            Dashboard Reclutador: {user?.name || 'Empresa'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontWeight: 700, color: '#1F3557' }}>Hola, Recruiter</Typography>
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#E5741F', color: '#fff', fontWeight: 700 }}>
              R
            </Avatar>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          {selectedMenuItem === null ? (
            <>
              <Paper
                sx={{
                  p: { xs: 2.2, md: 3 },
                  borderRadius: 3,
                  mb: 3.2,
                  boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
                  borderLeft: '5px solid #E5741F',
                }}
              >
                <Typography sx={{ fontSize: { xs: '1.85rem', md: '2.05rem' }, fontWeight: 800, color: '#1F3E69' }}>
                  Bienvenido a tu Panel de Reclutamiento
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, color: '#202D3D' }}>
                  Gestiona tus vacantes, candidatos y accede a los cursos de capacitacion para tu equipo.
                </Typography>
              </Paper>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mb: 4, alignItems: 'stretch' }}>
                <Box sx={{ flex: '1 1 220px', display: 'flex' }}>
                  <Card sx={{ borderRadius: 2.5, textAlign: 'center', p: 0.5, minHeight: 150, width: '100%', display: 'flex' }}>
                    <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Vacantes Activas</Typography>
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: '#1F3E69' }}>
                        {dashboardMetrics.openVacancies}
                      </Typography>
                      <Typography sx={{ mt: 1, fontWeight: 800, color: '#E5741F' }}>
                        {loadingDashboardMetrics ? 'ACTUALIZANDO...' : 'NO FINALIZADAS'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box sx={{ flex: '1 1 220px', display: 'flex' }}>
                  <Card sx={{ borderRadius: 2.5, textAlign: 'center', p: 0.5, minHeight: 150, width: '100%', display: 'flex' }}>
                    <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Candidatos Disponibles</Typography>
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: '#1F3E69' }}>
                        {dashboardMetrics.availableCandidates}
                      </Typography>
                      <Typography sx={{ mt: 1, fontWeight: 800, color: '#2EA35A' }}>
                        {loadingDashboardMetrics
                          ? 'ACTUALIZANDO...'
                          : `P:${dashboardMetrics.preselectedCandidates} | S:${dashboardMetrics.selectedCandidates} | F:${dashboardMetrics.finalistCandidates}`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box sx={{ flex: '1 1 220px', display: 'flex' }}>
                  <Card sx={{ borderRadius: 2.5, textAlign: 'center', p: 0.5, minHeight: 150, width: '100%', display: 'flex' }}>
                    <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Procesos Finalizados</Typography>
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: '#1F3E69' }}>
                        {dashboardMetrics.finishedRecruitmentProcesses}
                      </Typography>
                      <Typography sx={{ mt: 1, fontWeight: 800, color: '#1F3E69' }}>
                        {loadingDashboardMetrics ? 'ACTUALIZANDO...' : 'CON CANDIDATO ACEPTADO'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: '0px 3px 10px rgba(11,38,69,0.08)' }}>
                <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#0E1726' }}>Acciones Rapidas</Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setSelectedMenuItem('Crear Solicitud');
                      void Promise.all([loadRequestSkills(), loadMyCreatedVacancies()]);
                    }}
                    sx={{
                      bgcolor: '#173A68',
                      color: '#fff',
                      px: 3.5,
                      py: 1.3,
                      fontWeight: 800,
                      borderRadius: 1.5,
                      '&:hover': { bgcolor: '#112D51' },
                    }}
                  >
                    Nueva Vacante
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedMenuItem('Perfil Candidato')}
                    sx={{
                      borderColor: '#173A68',
                      color: '#173A68',
                      px: 3.5,
                      py: 1.3,
                      fontWeight: 800,
                      borderRadius: 1.5,
                    }}
                  >
                    Ver Candidatos
                  </Button>
                </Box>
              </Paper>
            </>
          ) : selectedMenuItem === 'Perfil Candidato' ? (
            renderCandidateProfileSection()
          ) : selectedMenuItem === 'Skills Validadas' ? (
            renderSkillsValidatedSection()
          ) : selectedMenuItem === 'CV / Living Profile' ? (
            renderCvLivingProfileSection()
          ) : selectedMenuItem === 'Cursos Realizados' ? (
            renderCoursesCompletedSection()
          ) : selectedMenuItem === 'Crear Solicitud' ? (
            renderCreateRequestSection()
          ) : selectedMenuItem === 'Mis Solicitudes' ? (
            renderMyRequestsSection()
          ) : selectedMenuItem === 'Candidatos Preseleccionados' ? (
            renderPreselectedCandidatesSection()
          ) : selectedMenuItem === 'Seleccionados' ? (
            renderSelectedCandidatesSection()
          ) : selectedMenuItem === 'Finalistas' ? (
            renderFinalistsSection()
          ) : selectedMenuItem === 'Cursos' ? (
            renderAcademyCoursesSection()
          ) : selectedMenuItem === 'Talleres' ? (
            renderWorkshopsSection()
          ) : (
            <Paper
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 3,
                minHeight: 360,
                boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
              }}
            >
              <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 800, color: '#1F3E69' }}>
                Seccion seleccionada: {selectedMenuItem}
              </Typography>
              <Typography sx={{ mt: 1.5, color: '#5C6F86', maxWidth: 720 }}>
                Esta vista es temporal para que el equipo de diseno defina el layout final de este modulo. La informacion estara asociada a la plataforma de talento mediante backend.
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};
