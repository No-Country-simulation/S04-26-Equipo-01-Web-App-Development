import { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  LinearProgress, 
  Button, 
  Card, 
  CardContent,
  Avatar,
  TextField,
  Chip,
  CircularProgress
} from '@mui/material';
import { CloudUploadOutlined, ErrorOutlined } from '@mui/icons-material';
import type { AuthUser } from '../../types/auth.types';
import type { ParsedCvDataAdvanced } from '../../utils/cv-parser-advanced';
import { parseAdvancedCv } from '../../utils/cv-parser-advanced';
import {
  createMyProfile,
  getMyLatestCvDiagnostic,
  saveMyCvDiagnostic,
  updateMyProfile,
} from '../../services/profile.service';
import { createMySkill, getMySkills, updateMySkill } from '../../services/skill.service';
import { getMyAllTestResults } from '../../services/assessment.service';
import { getMyLearningPaths } from '../../services/learning.service';
import {
  getMyRecruiterFeedback,
  type TalentRecruiterFeedback,
} from '../../services/recruiter.service';
import type { CvDiagnostic } from '../../types/profile.types';
import type { SkillLevel, UserSkill } from '../../types/skill.types';
import type { AssessmentTestResultEntity } from '../../types/assessment.types';
import type { LearningPath } from '../../types/learning.types';
import { AssessmentTestsPanel, AssessmentResultsPanel } from '../../components/AssessmentTestsPanel';
import { LearningRoadmapPanel } from '../../components/LearningRoadmapPanel';

interface TalentDashboardProps {
  user: AuthUser;
}

export const TalentDashboard = ({ user }: TalentDashboardProps) => {
  const SKILL_CATEGORY_TECHNICAL = 'TECHNICAL';
  const SKILL_CATEGORY_PERSONAL = 'PERSONAL';
  const LEARNING_MENU_ITEMS = [
    'Mi Ruta de Cursos',
    'Pendientes',
    'En Ejecucion',
    'Resultados (Diplomas)',
  ] as const;

  const sidebarSections = [
    {
      title: 'EVALUACION PERFIL',
      items: ['Tecnica', 'Psicotecnica', 'Resultados'],
    },
    {
      title: 'SKILLS',
      items: ['Editar Skills', 'Ver Informe de Skills'],
    },
    {
      title: 'MI CV PROFESIONAL',
      items: ['Ver CV Actual', 'Cargar Nuevo CV', 'Actualizar Datos'],
    },
    {
      title: 'FORMACIÓN',
      items: [...LEARNING_MENU_ITEMS],
    },
    {
      title: 'POSTULACIONES',
      items: ['Feedback de Reclutador'],
    },
  ];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'EVALUACION PERFIL': true,
    SKILLS: true,
    'MI CV PROFESIONAL': true,
    'FORMACIÓN': true,
    POSTULACIONES: true,
  });
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);
  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [isProcessingCv, setIsProcessingCv] = useState(false);
  const [cvInfoMessage, setCvInfoMessage] = useState<string | null>(null);
  const [rawCvText, setRawCvText] = useState('');
  const [advancedCvData, setAdvancedCvData] = useState<ParsedCvDataAdvanced | null>(null);
  const [cvFormData, setCvFormData] = useState<ParsedCvDataAdvanced | null>(null);
  const [isSavingCv, setIsSavingCv] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isLoadingDiagnostic, setIsLoadingDiagnostic] = useState(true);
  const [isLoadingProfileSkills, setIsLoadingProfileSkills] = useState(true);
  const [isConfirmingSkills, setIsConfirmingSkills] = useState(false);
  const [latestDiagnostic, setLatestDiagnostic] = useState<CvDiagnostic | null>(null);
  const [profileSkills, setProfileSkills] = useState<UserSkill[]>([]);
  const [assessmentTestResults, setAssessmentTestResults] = useState<AssessmentTestResultEntity[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [onboardingModeEnabled, setOnboardingModeEnabled] = useState(false);
  const [skillsVerified, setSkillsVerified] = useState(false);
  const [learningRoadmapRefreshToken, setLearningRoadmapRefreshToken] = useState(0);
  const [talentFeedback, setTalentFeedback] = useState<TalentRecruiterFeedback[]>(
    [],
  );
  const [loadingTalentFeedback, setLoadingTalentFeedback] = useState(false);
  const [talentFeedbackError, setTalentFeedbackError] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialLoadTriggeredRef = useRef(false);

  const ensureParsedCvData = (data: ParsedCvDataAdvanced): ParsedCvDataAdvanced => ({
    profile: {
      fullName: data?.profile?.fullName ?? '',
      email: data?.profile?.email ?? '',
      phone: data?.profile?.phone ?? '',
      location: data?.profile?.location ?? '',
      title: data?.profile?.title ?? '',
      professionalSummary: data?.profile?.professionalSummary ?? '',
    },
    socialLinks: data?.socialLinks,
    experience: Array.isArray(data?.experience)
      ? data.experience.map((item) => ({
          company: item?.company ?? '',
          position: item?.position ?? '',
          startDate: item?.startDate ?? '',
          endDate: item?.endDate ?? '',
          description: item?.description ?? '',
          highlights: Array.isArray(item?.highlights)
            ? item.highlights.filter((value) => typeof value === 'string')
            : undefined,
        }))
      : [],
    education: Array.isArray(data?.education)
      ? data.education.map((item) => ({
          institution: item?.institution ?? '',
          degree: item?.degree ?? '',
          details: item?.details ?? '',
          status:
            item?.status === 'completed' || item?.status === 'in-progress'
              ? item.status
              : undefined,
        }))
      : [],
    skills: {
      technical: Array.isArray(data?.skills?.technical)
        ? data.skills.technical.filter((value) => typeof value === 'string')
        : [],
      personal: Array.isArray(data?.skills?.personal)
        ? data.skills.personal.filter((value) => typeof value === 'string')
        : [],
    },
  });

  const toParsedCvData = (diagnostic: CvDiagnostic): ParsedCvDataAdvanced | null => {
    const snapshot = diagnostic.snapshot as
      | {
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
          experience?: Array<{
            company?: string;
            position?: string;
            startDate?: string;
            endDate?: string;
            description?: string;
            highlights?: string[];
          }>;
          education?: Array<{
            institution?: string;
            degree?: string;
            details?: string;
            status?: string;
          }>;
        }
      | undefined;

    if (!snapshot) {
      return null;
    }

    return {
      profile: {
        fullName: snapshot.profile?.fullName ?? '',
        email: snapshot.profile?.email ?? '',
        phone: snapshot.profile?.phone ?? '',
        location: snapshot.profile?.location ?? '',
        title: snapshot.profile?.title,
        professionalSummary: snapshot.profile?.professionalSummary ?? '',
      },
      experience: (snapshot.experience ?? []).map((experience) => ({
        company: experience.company ?? '',
        position: experience.position ?? '',
        startDate: experience.startDate ?? '',
        endDate: experience.endDate ?? '',
        description: experience.description ?? '',
        highlights: experience.highlights ?? [],
      })),
      education: (snapshot.education ?? []).map((education) => ({
        institution: education.institution ?? '',
        degree: education.degree ?? '',
        details: education.details,
        status:
          education.status === 'in-progress' || education.status === 'completed'
            ? education.status
            : undefined,
      })),
      skills: {
        technical: snapshot.skills?.technical ?? diagnostic.technicalSkills,
        personal: snapshot.skills?.personal ?? diagnostic.personalSkills,
      },
    };
  };

  const onboardingStorageKey = `talent-onboarding-completed-${user.email ?? user.name ?? 'default'}`;
  const onboardingSkillsVerifiedKey = `${onboardingStorageKey}-skills-verified`;

  useEffect(() => {
    if (initialLoadTriggeredRef.current) {
      return;
    }

    initialLoadTriggeredRef.current = true;

    const loadProfileData = async () => {
      try {
        const [diagnostic, skills, tests, paths] = await Promise.all([
          getMyLatestCvDiagnostic().catch(() => null),
          getMySkills().catch(() => []),
          getMyAllTestResults().catch(() => []),
          getMyLearningPaths().catch(() => []),
        ]);

        setProfileSkills(skills);
        setAssessmentTestResults(tests);
        setLearningPaths(paths);

        const alreadyCompleted = window.localStorage.getItem(onboardingStorageKey) === '1';
        const alreadyVerifiedSkills = window.localStorage.getItem(onboardingSkillsVerifiedKey) === '1';
        const shouldMarkCompleted = alreadyCompleted || paths.length > 0;
        if (shouldMarkCompleted) {
          window.localStorage.setItem(onboardingStorageKey, '1');
          setOnboardingModeEnabled(false);
        } else {
          setOnboardingModeEnabled(true);
        }

        if (!skills.length) {
          window.localStorage.removeItem(onboardingSkillsVerifiedKey);
          setSkillsVerified(false);
        } else {
          setSkillsVerified(alreadyVerifiedSkills);
        }

        if (!diagnostic) {
          setLatestDiagnostic(null);
          setAdvancedCvData(null);
          return;
        }

        setLatestDiagnostic(diagnostic);
        const parsedCvData = toParsedCvData(diagnostic);
        if (parsedCvData) {
          const safeParsedData = ensureParsedCvData(parsedCvData);
          setAdvancedCvData(safeParsedData);
          setCvFormData(safeParsedData);
        }
      } catch {
        setLatestDiagnostic(null);
        setAdvancedCvData(null);
        setProfileSkills([]);
        setAssessmentTestResults([]);
        setLearningPaths([]);
        setSkillsVerified(false);
      } finally {
        setIsLoadingDiagnostic(false);
        setIsLoadingProfileSkills(false);
      }
    };

    void loadProfileData();
  }, [onboardingStorageKey, onboardingSkillsVerifiedKey]);

  const toSkillLevel = (): SkillLevel => 'INITIAL';

  const buildCvSummary = (data: ParsedCvDataAdvanced): string => {
    const technicalCount = data.skills.technical.length;
    const personalCount = data.skills.personal.length;
    const experienceCount = data.experience.length;

    return `Perfil inicial detectado: ${experienceCount} experiencias, ${technicalCount} skills tecnicas y ${personalCount} skills personales.`;
  };

  const normalizeSkillName = (name: string): string => name.trim().toLowerCase();

  const formatSkillLevel = (level: SkillLevel): string => {
    const labels: Record<SkillLevel, string> = {
      INITIAL: 'Inicial',
      MEDIUM: 'Intermedio',
      ADVANCED: 'Avanzado',
    };

    return labels[level] ?? level;
  };

  const renderPersistedSkillCard = (userSkill: UserSkill, keyPrefix: string) => {
    const isPersonal =
      userSkill.skill?.category?.toLowerCase().includes('personal') ?? false;
    const skillName = userSkill.skill?.name ?? 'Skill';

    return (
      <Box
        key={`${keyPrefix}-${userSkill.id}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          p: 1.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: isPersonal ? '#E9D5FF' : '#BFDBFE',
          bgcolor: isPersonal ? '#FAF5FF' : '#F7FBFF',
          minHeight: 62,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: '#173A68',
              fontWeight: 800,
              fontSize: '0.98rem',
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}
          >
            {skillName}
          </Typography>
          <Typography
            sx={{
              mt: 0.45,
              color: isPersonal ? '#7C3AED' : '#2563EB',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            {isPersonal ? 'Skill personal' : 'Skill tecnica'}
          </Typography>
        </Box>

        <Box
          sx={{
            flexShrink: 0,
            px: 1.2,
            py: 0.65,
            borderRadius: 999,
            bgcolor: isPersonal ? '#E9D5FF' : '#DBEAFE',
            color: isPersonal ? '#6B21A8' : '#1D4ED8',
            fontWeight: 800,
            fontSize: '0.8rem',
            minWidth: 92,
            textAlign: 'center',
          }}
        >
          {formatSkillLevel(userSkill.level)}
        </Box>
      </Box>
    );
  };

  const hasCvUploaded = latestDiagnostic !== null;
  const hasSkillsGenerated = profileSkills.length > 0;
  const hasTechnicalSkillsPersisted = profileSkills.some(
    (userSkill) => userSkill.skill?.category?.toLowerCase().includes('technical') ?? false,
  );
  const hasTechnicalSkillsInCvDraft = (cvFormData?.skills.technical ?? []).some(
    (skill) => skill.trim().length > 0,
  );
  const canConfirmSkillsAndContinue = hasTechnicalSkillsPersisted || hasTechnicalSkillsInCvDraft;
  const hasVerifiedSkills = hasSkillsGenerated && skillsVerified;
  const hasRoadmapGenerated = learningPaths.length > 0;
  const hasPsychotechnicalResults = assessmentTestResults.some(
    (result) => result.type === 'PSYCHOTECHNICAL',
  );
  const hasTechnicalResults = assessmentTestResults.some(
    (result) => result.type === 'TECHNICAL',
  );
  const onboardingCompletedSteps = [
    hasCvUploaded,
    hasVerifiedSkills,
    hasTechnicalResults,
    hasPsychotechnicalResults,
    hasRoadmapGenerated,
  ].filter(Boolean).length;

  const onboardingProgressPercentage = Math.round((onboardingCompletedSteps / 5) * 100);
  const evaluationsCount = `${onboardingCompletedSteps}/5`;

  const coursesInProgress = learningPaths
    .flatMap((path) => path.modules ?? [])
    .filter((module) => module.progress?.[0]?.status === 'IN_PROGRESS').length;

  const learningCoursesForCv = useMemo(() => {
    const modules = learningPaths.flatMap((path) =>
      (path.modules ?? []).map((module) => ({
        id: module.id,
        title: module.title,
        status: module.progress?.[0]?.status ?? 'PENDING',
      })),
    );

    const viewed = modules.filter(
      (module) => module.status === 'IN_PROGRESS' || module.status === 'COMPLETED',
    );
    const approved = modules.filter((module) => module.status === 'COMPLETED');

    return {
      viewed,
      approved,
    };
  }, [learningPaths]);

  const validatedSkills = `+${profileSkills.length}`;

  const suggestedStep = !hasCvUploaded
    ? {
        title: 'Inicia tu configuracion rapida de talento',
        description:
          'Necesitamos cargar tu CV para comenzar el proceso de perfilado.',
        buttonLabel: 'INICIAR CONFIGURACION',
        targetMenuItem: 'Cargar Nuevo CV',
      }
    : !hasVerifiedSkills
      ? {
          title: 'Verifica tus skills guardadas',
          description:
            'Confirma que tus skills esten correctamente persistidas antes de iniciar las pruebas.',
          buttonLabel: 'IR A VERIFICAR SKILLS',
          targetMenuItem: 'Editar Skills',
        }
      : !hasTechnicalResults
        ? {
            title: 'Ahora completa tu prueba tecnica',
            description:
              hasTechnicalSkillsPersisted
                ? 'Tus pruebas tecnicas se generan en funcion de tus skills tecnicos guardados.'
                : 'No encontramos skills tecnicos guardados. Revisa y guarda al menos uno para continuar.',
            buttonLabel: hasTechnicalSkillsPersisted ? 'INICIAR PRUEBA TECNICA' : 'REVISAR SKILLS TECNICAS',
            targetMenuItem: hasTechnicalSkillsPersisted ? 'Tecnica' : 'Editar Skills',
          }
        : !hasPsychotechnicalResults
          ? {
              title: 'Continua con la prueba psicotecnica',
              description:
                'Con la prueba tecnica completada, sigue con la psicotecnica para cerrar tu assessment.',
              buttonLabel: 'INICIAR PRUEBA PSICOTECNICA',
              targetMenuItem: 'Psicotecnica',
          }
        : {
            title: 'Revisa tus resultados y continua a tu ruta',
            description:
              'Tus pruebas estan completas. Verifica resultados y luego continua con tu ruta de cursos.',
            buttonLabel: 'VER RESULTADOS',
            targetMenuItem: 'Resultados',
          };

  const handleRoadmapGenerated = (): void => {
    void Promise.all([
      getMyLearningPaths().catch(() => []),
      getMyAllTestResults().catch(() => []),
    ]).then(([paths, tests]) => {
      setLearningPaths(paths);
      setAssessmentTestResults(tests);
    });

    setLearningRoadmapRefreshToken((currentToken) => currentToken + 1);
  };

  const handleContinueToLearningRoute = (): void => {
    window.localStorage.setItem(onboardingStorageKey, '1');
    setOnboardingModeEnabled(false);
    setSelectedMenuItem('Mi Ruta de Cursos');
  };

  const handleConfirmSkillsAndContinue = async (): Promise<void> => {
    if (!canConfirmSkillsAndContinue) {
      setSaveErrorMessage(
        'Para continuar necesitas al menos una skill tecnica detectada en CV o guardada en backend.',
      );
      return;
    }

    setSaveErrorMessage(null);
    window.localStorage.setItem(onboardingSkillsVerifiedKey, '1');
    setSkillsVerified(true);
    setSelectedMenuItem('Tecnica');

    if (!cvFormData) {
      return;
    }

    setIsConfirmingSkills(true);
    void syncSkillsFromCv(cvFormData)
      .then(() => getMySkills())
      .then((refreshedSkills) => {
        setProfileSkills(refreshedSkills);
      })
      .catch((error) => {
        const message = error instanceof Error
          ? error.message
          : 'No se pudieron sincronizar las skills antes de iniciar la prueba tecnica.';
        setSaveErrorMessage(message);
      })
      .finally(() => {
        setIsConfirmingSkills(false);
      });
  };

  const handleAssessmentTestCompleted = async (
    testType: 'TECHNICAL' | 'PSYCHOTECHNICAL',
  ): Promise<void> => {
    const refreshedTests = await getMyAllTestResults().catch(() => []);
    setAssessmentTestResults(refreshedTests);

    if (!onboardingModeEnabled) {
      return;
    }

    if (testType === 'TECHNICAL') {
      setSelectedMenuItem('Psicotecnica');
      return;
    }

    setSelectedMenuItem('Resultados');
  };

  const syncSkillsFromCv = async (data: ParsedCvDataAdvanced): Promise<void> => {
    const existingSkills = await getMySkills();
    const existingByName = new Map<string, UserSkill[]>();

    existingSkills.forEach((userSkill) => {
      const name = userSkill.skill?.name ?? '';
      if (name) {
        const normalizedName = normalizeSkillName(name);
        const currentSkills = existingByName.get(normalizedName) ?? [];
        currentSkills.push(userSkill);
        existingByName.set(normalizedName, currentSkills);
      }
    });

    const desiredSkills = [
      ...data.skills.technical.map((name) => ({ name, category: SKILL_CATEGORY_TECHNICAL })),
      ...data.skills.personal.map((name) => ({ name, category: SKILL_CATEGORY_PERSONAL })),
    ];

    for (const desiredSkill of desiredSkills) {
      const normalizedName = normalizeSkillName(desiredSkill.name);
      if (!normalizedName) {
        continue;
      }

      const existingCandidates = existingByName.get(normalizedName) ?? [];
      const exactCategoryMatch = existingCandidates.find(
        (userSkill) => userSkill.skill?.category?.toUpperCase() === desiredSkill.category,
      );
      const existing = exactCategoryMatch ?? existingCandidates[0];

      if (existing) {
        await updateMySkill(existing.skillId, {
          level: toSkillLevel(),
          source: 'cv_auto',
        });
        continue;
      }

      await createMySkill({
        name: desiredSkill.name,
        category: desiredSkill.category,
        level: toSkillLevel(),
        source: 'cv_auto',
      });
    }
  };

  const handleSaveCvForm = async () => {
    if (!cvFormData) {
      setSaveErrorMessage('No hay formulario para guardar. Primero carga un CV.');
      return;
    }

    try {
      setIsSavingCv(true);
      setSaveErrorMessage(null);
      setSaveSuccessMessage(null);

      const profilePayload = {
        fullName: cvFormData.profile.fullName || user.name || 'Sin nombre',
        location: cvFormData.profile.location || undefined,
        headline: cvFormData.profile.title || undefined,
        professionalBio: cvFormData.profile.professionalSummary || undefined,
        yearsExperience:
          cvFormData.experience.length > 0 ? cvFormData.experience.length : undefined,
      };

      try {
        await createMyProfile(profilePayload);
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : '';
        if (message.includes('ya existe')) {
          await updateMyProfile(profilePayload);
        } else {
          throw error;
        }
      }

      await syncSkillsFromCv(cvFormData);

      const savedDiagnostic = await saveMyCvDiagnostic({
        fileName: selectedCvFile?.name,
        rawText: rawCvText || undefined,
        summary: buildCvSummary(cvFormData),
        profile: {
          fullName: cvFormData.profile.fullName || undefined,
          email: cvFormData.profile.email || undefined,
          phone: cvFormData.profile.phone || undefined,
          location: cvFormData.profile.location || undefined,
          title: cvFormData.profile.title || undefined,
          professionalSummary: cvFormData.profile.professionalSummary || undefined,
        },
        skills: {
          technical: cvFormData.skills.technical,
          personal: cvFormData.skills.personal,
        },
        experience: cvFormData.experience.map((experience) => ({
          company: experience.company,
          position: experience.position,
          startDate: experience.startDate || undefined,
          endDate: experience.endDate || undefined,
          description: experience.description || undefined,
          highlights: experience.highlights ?? [],
        })),
        education: cvFormData.education.map((education) => ({
          institution: education.institution,
          degree: education.degree,
          details: education.details || undefined,
          status: education.status || undefined,
        })),
      });
      const refreshedSkills = await getMySkills();
      const refreshedTests = await getMyAllTestResults().catch(() => []);

      window.localStorage.removeItem(onboardingSkillsVerifiedKey);
      setSkillsVerified(false);

      setLatestDiagnostic(savedDiagnostic);
      setProfileSkills(refreshedSkills);
      setAssessmentTestResults(refreshedTests);
      setAdvancedCvData(cvFormData);

      if (onboardingModeEnabled) {
        setSaveSuccessMessage(
          'CV guardado correctamente. Ahora verifica tus skills para continuar con la prueba tecnica.',
        );
        setSelectedMenuItem('Editar Skills');
      } else {
        setSaveSuccessMessage('Datos guardados correctamente en backend: perfil, skills y diagnostico inicial.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar la informacion del CV.';
      setSaveErrorMessage(message);
    } finally {
      setIsSavingCv(false);
    }
  };

  const updateProfileField = (field: keyof ParsedCvDataAdvanced['profile'], value: string) => {
    setCvFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          [field]: value,
        },
      };
    });
  };

  const updateExperienceField = (index: number, field: keyof ParsedCvDataAdvanced['experience'][number], value: string) => {
    setCvFormData((prev) => {
      if (!prev) return prev;
      const nextExperience = [...prev.experience];
      nextExperience[index] = {
        ...nextExperience[index],
        [field]: value,
      };
      return {
        ...prev,
        experience: nextExperience,
      };
    });
  };

  const updateEducationField = (index: number, field: keyof ParsedCvDataAdvanced['education'][number], value: string) => {
    setCvFormData((prev) => {
      if (!prev) return prev;
      const nextEducation = [...prev.education];
      nextEducation[index] = {
        ...nextEducation[index],
        [field]: value,
      };
      return {
        ...prev,
        education: nextEducation,
      };
    });
  };

  const addExperience = () => {
    setCvFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        experience: [
          ...prev.experience,
          {
            company: '',
            position: '',
            startDate: '',
            endDate: '',
            description: '',
            highlights: [],
          },
        ],
      };
    });
  };

  const removeExperience = (index: number) => {
    setCvFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        experience: prev.experience.filter((_, currentIndex) => currentIndex !== index),
      };
    });
  };

  const addEducation = () => {
    setCvFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        education: [
          ...prev.education,
          {
            institution: '',
            degree: '',
            details: '',
            status: 'completed',
          },
        ],
      };
    });
  };

  const removeEducation = (index: number) => {
    setCvFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        education: prev.education.filter((_, currentIndex) => currentIndex !== index),
      };
    });
  };

  const updateSkills = (type: 'technical' | 'personal', value: string) => {
    setCvFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        skills: {
          ...prev.skills,
          [type]: value
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean),
        },
      };
    });
  };

  const handleToggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const loadTalentRecruiterFeedback = async () => {
    setLoadingTalentFeedback(true);
    setTalentFeedbackError(null);

    try {
      const feedbacks = await getMyRecruiterFeedback();
      setTalentFeedback(feedbacks);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo cargar el feedback de reclutadores.';
      setTalentFeedbackError(message);
      setTalentFeedback([]);
    } finally {
      setLoadingTalentFeedback(false);
    }
  };

  const handleMenuSelection = (item: string | null) => {
    setSelectedMenuItem(item);

    if (item === 'Feedback de Reclutador') {
      void loadTalentRecruiterFeedback();
    }
  };

  const handleCvSelection = (file: File | null) => {
    if (!file) {
      setSelectedCvFile(null);
      setCvError(null);
      return;
    }

    const hasPdfMime = file.type === 'application/pdf';
    const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');

    if (!hasPdfMime && !hasPdfExtension) {
      setSelectedCvFile(null);
      setCvError('Solo se permiten archivos PDF.');
      return;
    }

    const maxFileSizeMb = 5;
    if (file.size > maxFileSizeMb * 1024 * 1024) {
      setSelectedCvFile(null);
      setCvError('El PDF no debe superar los 5 MB.');
      return;
    }

    setSelectedCvFile(file);
    setCvError(null);
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);
  };

  const readPdfText = async (file: File): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Usar worker desde carpeta public (sin problemas CORS)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const fileBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) });
    const pdf = await loadingTask.promise;

    const pagesText: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const positionedTokens = textContent.items
        .map((item) => {
          if (!('str' in item) || !Array.isArray((item as { transform?: unknown }).transform)) {
            return null;
          }

          const chunk = item.str.trim();
          const transform = (item as { transform: number[] }).transform;
          if (!chunk || transform.length < 6) {
            return null;
          }

          return {
            text: chunk,
            x: Number(transform[4]) || 0,
            y: Number(transform[5]) || 0,
          };
        })
        .filter((token): token is { text: string; x: number; y: number } => token !== null);

      if (positionedTokens.length === 0) {
        pagesText.push('');
        continue;
      }

      positionedTokens.sort((a, b) => {
        if (Math.abs(a.y - b.y) < 1.5) {
          return a.x - b.x;
        }

        return b.y - a.y;
      });

      const lines: Array<{ y: number; tokens: Array<{ text: string; x: number }> }> = [];
      const lineTolerance = 2;

      positionedTokens.forEach((token) => {
        const currentLine = lines[lines.length - 1];
        if (!currentLine || Math.abs(currentLine.y - token.y) > lineTolerance) {
          lines.push({ y: token.y, tokens: [{ text: token.text, x: token.x }] });
          return;
        }

        currentLine.tokens.push({ text: token.text, x: token.x });
      });

      const pageText = lines
        .map((line) =>
          line.tokens
            .sort((a, b) => a.x - b.x)
            .map((token) => token.text)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim(),
        )
        .filter(Boolean)
        .join('\n');

      pagesText.push(pageText);
    }

    return pagesText.join('\n');
  };

  const handleProcessCvUpload = async () => {
    if (!selectedCvFile) {
      setCvError('Selecciona un archivo PDF antes de subir.');
      return;
    }

    try {
      setIsProcessingCv(true);
      setCvError(null);
      setCvInfoMessage(null);
      setSaveErrorMessage(null);
      setSaveSuccessMessage(null);

      const cvRawText = await readPdfText(selectedCvFile);

      if (!cvRawText.trim()) {
        setCvError(
          'No se detecto texto en el PDF. Si es un escaneo, usa un PDF con texto seleccionable (OCR).',
        );
        return;
      }

      setRawCvText(cvRawText);
      
      const advancedData = ensureParsedCvData(parseAdvancedCv(cvRawText));
      setAdvancedCvData(advancedData);
      setCvFormData(advancedData);
      
      setCvInfoMessage(
        '✅ PDF procesado correctamente. Revisa el formulario y pulsa "Guardar CV" para subirlo al backend.',
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Error desconocido';
      setCvError(`No fue posible leer el PDF. Verifica el archivo e intenta nuevamente. Detalle: ${detail}`);
    } finally {
      setIsProcessingCv(false);
    }
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
            onClick={() => handleMenuSelection(null)}
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
            DASHBOARD TALENTO
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
            minHeight: 58,
            bgcolor: '#F8FBFF',
            borderBottom: '1px solid #D7E1EC',
            px: { xs: 2, md: 4 },
            py: { xs: 1.2, md: 0 },
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: { xs: 'wrap', md: 'nowrap' },
          }}
        >
          <Typography sx={{ fontWeight: 700, color: '#1F3557' }}>Hola, {user?.name || 'Talent'}</Typography>
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#E6EDF6', color: '#213D63', fontWeight: 700 }}>
            {(user?.name || 'T').charAt(0).toUpperCase()}
          </Avatar>
        </Box>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Box
            sx={{
              display: { xs: 'grid', md: 'none' },
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 1,
              pb: 1.2,
              mb: 1.2,
            }}
          >
            {sidebarSections.flatMap((section) =>
              section.items.map((item) => (
                <Button
                  key={`mobile-talent-${item}`}
                  variant={selectedMenuItem === item ? 'contained' : 'outlined'}
                  onClick={() => handleMenuSelection(item)}
                  sx={{
                    width: '100%',
                    minHeight: 42,
                    px: 1,
                    py: 0.8,
                    whiteSpace: 'normal',
                    lineHeight: 1.2,
                    textAlign: 'center',
                    fontSize: '0.78rem',
                    textTransform: 'none',
                    borderColor: '#173A68',
                    color: selectedMenuItem === item ? '#fff' : '#173A68',
                    bgcolor: selectedMenuItem === item ? '#173A68' : 'transparent',
                    '&:hover': {
                      bgcolor: selectedMenuItem === item ? '#112D51' : 'rgba(23,58,104,0.08)',
                    },
                  }}
                >
                  {item}
                </Button>
              )),
            )}
          </Box>

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
                  Bienvenido a tu Red de Bienestar
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, color: '#202D3D' }}>
                  Tu ruta inicial de talento esta al <strong>{onboardingProgressPercentage}%</strong> de completitud. Puedes hacer el flujo sugerido o navegar manualmente desde el menu.
                </Typography>
              </Paper>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mb: 4, alignItems: 'stretch' }}>
                <Box sx={{ flex: '1 1 220px', display: 'flex' }}>
                  <Card sx={{ borderRadius: 2.5, textAlign: 'center', p: 0.5, minHeight: 150, width: '100%', display: 'flex' }}>
                    <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Evaluacion del Camino</Typography>
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: '#1F3E69' }}>{evaluationsCount}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={onboardingProgressPercentage}
                        sx={{
                          mt: 1.5,
                          height: 4,
                          borderRadius: 8,
                          bgcolor: '#E1E8F0',
                          '& .MuiLinearProgress-bar': { bgcolor: '#1F3E69' },
                        }}
                      />
                    </CardContent>
                  </Card>
                </Box>

                <Box sx={{ flex: '1 1 220px', display: 'flex' }}>
                  <Card sx={{ borderRadius: 2.5, textAlign: 'center', p: 0.5, minHeight: 150, width: '100%', display: 'flex' }}>
                    <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Cursos en Marcha</Typography>
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: '#1F3E69' }}>{coursesInProgress}</Typography>
                      <Typography sx={{ mt: 1, fontWeight: 800, color: '#E5741F' }}>PROGRESO ACTIVO</Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box sx={{ flex: '1 1 220px', display: 'flex' }}>
                  <Card sx={{ borderRadius: 2.5, textAlign: 'center', p: 0.5, minHeight: 150, width: '100%', display: 'flex' }}>
                    <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Nuevas Skills</Typography>
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: '#1F3E69' }}>{validatedSkills}</Typography>
                      <Typography sx={{ mt: 1, fontWeight: 800, color: '#2EA35A' }}>VALIDADAS</Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {onboardingModeEnabled && (
                <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: '0px 3px 10px rgba(11,38,69,0.08)' }}>
                  <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#0E1726' }}>Proximo Paso Sugerido</Typography>
                  <Box sx={{ mt: 1.8, borderTop: '1px solid #D5DEEA', pt: 2.4, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.6 }}>
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          bgcolor: '#E5741F',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ErrorOutlined sx={{ color: '#fff' }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '1.55rem', fontWeight: 800, color: '#0E1726' }}>
                          {suggestedStep.title}
                        </Typography>
                        <Typography sx={{ color: '#6F8098', mt: 0.5 }}>
                          {suggestedStep.description}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => {
                        setOnboardingModeEnabled(true);
                        setSelectedMenuItem(suggestedStep.targetMenuItem);
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
                      {suggestedStep.buttonLabel}
                    </Button>
                  </Box>
                </Paper>
              )}
            </>
          ) : selectedMenuItem === 'Cargar Nuevo CV' ? (
            <Paper
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 3,
                minHeight: 360,
                boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
              }}
            >
              <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 800, color: '#1F3E69' }}>
                Cargar Nuevo CV
              </Typography>
              <Typography sx={{ mt: 1.2, color: '#5C6F86', maxWidth: 720 }}>
                Sube tu CV en formato PDF para mantener tu perfil profesional actualizado.
              </Typography>

              {onboardingModeEnabled && !hasCvUploaded && (
                <Box sx={{ mt: 2.2, p: 2, bgcolor: '#FFF3E0', borderRadius: 2, border: '1px solid #FFB74D' }}>
                  <Typography sx={{ color: '#E65100', fontWeight: 700 }}>
                    Necesitamos cargar tu CV para iniciar el proceso. Cuando lo guardes, verificaras skills y luego comenzaras con la prueba tecnica.
                  </Typography>
                </Box>
              )}

              <Box
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const file = event.dataTransfer.files?.[0] ?? null;
                  handleCvSelection(file);
                }}
                sx={{
                  mt: 3,
                  border: '2px dashed #8AA6C8',
                  bgcolor: '#F6FAFF',
                  borderRadius: 2,
                  minHeight: 190,
                  px: { xs: 2, md: 3 },
                  py: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#1F3E69',
                    bgcolor: '#EEF5FF',
                  },
                }}
              >
                <CloudUploadOutlined sx={{ fontSize: 44, color: '#1F3E69' }} />
                <Typography sx={{ mt: 1.3, fontWeight: 700, color: '#1F3E69' }}>
                  Arrastra y suelta tu CV aqui o haz clic para seleccionar un PDF
                </Typography>
                <Typography sx={{ mt: 0.7, color: '#6E819A' }}>
                  Formato permitido: .pdf | Tamano maximo: 5 MB
                </Typography>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    handleCvSelection(file);
                  }}
                />
              </Box>

              {cvError && (
                <Typography sx={{ mt: 1.5, color: '#B42318', fontWeight: 600 }}>
                  {cvError}
                </Typography>
              )}

              {cvInfoMessage && (
                <Typography sx={{ mt: 1.5, color: '#1F3E69', fontWeight: 600 }}>
                  {cvInfoMessage}
                </Typography>
              )}

              {selectedCvFile && (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: '#EAF4FF',
                    border: '1px solid #C2DBFA',
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: '#1D3D68' }}>
                    Archivo listo para cargar:
                  </Typography>
                  <Typography sx={{ color: '#35557A', mt: 0.3 }}>
                    {selectedCvFile.name}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 2.5, display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  disabled={!selectedCvFile || isProcessingCv}
                  onClick={handleProcessCvUpload}
                  sx={{
                    bgcolor: '#173A68',
                    color: '#fff',
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#112D51' },
                    '&.Mui-disabled': { bgcolor: '#9FB4CD', color: '#E8EFF8' },
                  }}
                >
                  {isProcessingCv ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={18} sx={{ color: '#fff' }} />
                      PROCESANDO CV
                    </Box>
                  ) : (
                    'PROCESAR CV'
                  )}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedCvFile(null);
                    setCvError(null);
                    setCvInfoMessage(null);
                    setRawCvText('');
                    setAdvancedCvData(null);
                    setCvFormData(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  sx={{
                    borderColor: '#1F3E69',
                    color: '#1F3E69',
                    fontWeight: 700,
                    '&:hover': { borderColor: '#173A68', bgcolor: '#EDF4FF' },
                  }}
                >
                  LIMPIAR
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleSaveCvForm}
                  disabled={isSavingCv || isProcessingCv || !cvFormData}
                  sx={{
                    borderColor: '#8AA6C8',
                    color: '#35557A',
                    fontWeight: 700,
                    '&:hover': { borderColor: '#6F8FB5', bgcolor: '#F3F8FF' },
                  }}
                >
                  {isSavingCv ? 'Guardando CV...' : 'Guardar CV'}
                </Button>
              </Box>

              {advancedCvData && (
                <>
                  <Box sx={{ mt: 3, p: 2, bgcolor: '#E8F5E9', borderRadius: 2, border: '1px solid #4CAF50' }}>
                    <Typography sx={{ fontWeight: 700, color: '#2E7D32', mb: 1 }}>
                      📋 Datos extraídos correctamente
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                      <Typography sx={{ color: '#1B5E20' }}>
                        ✓ Nombre: <strong>{advancedCvData.profile.fullName}</strong>
                      </Typography>
                      <Typography sx={{ color: '#1B5E20' }}>
                        ✓ {advancedCvData.experience.length === 1 ? 'Experiencia' : 'Experiencias'}: <strong>{advancedCvData.experience.length}</strong>
                      </Typography>
                      <Typography sx={{ color: '#1B5E20' }}>
                        ✓ Educación: <strong>{advancedCvData.education.length}</strong>
                      </Typography>
                      <Typography sx={{ color: '#1B5E20' }}>
                        ✓ Skills técnicas: <strong>{advancedCvData.skills.technical.length}</strong>
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2.5, p: 2.5, borderRadius: 2, border: '2px solid #1F3E69', bgcolor: '#F0F6FF' }}>
                    <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 2, fontSize: '1.1rem' }}>
                      🎯 Skills Detectadas del CV
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography sx={{ fontWeight: 700, color: '#284D78', mb: 1, fontSize: '0.95rem' }}>
                        SKILLS TÉCNICAS ({advancedCvData.skills.technical.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, minHeight: 32 }}>
                        {advancedCvData.skills.technical.length > 0 ? (
                          advancedCvData.skills.technical.map((skill, index) => (
                            <Chip
                              key={`tech-skill-${index}`}
                              label={skill}
                              onDelete={() => {
                                const updatedSkills = advancedCvData.skills.technical.filter((_, i) => i !== index);
                                setAdvancedCvData({
                                  ...advancedCvData,
                                  skills: {
                                    ...advancedCvData.skills,
                                    technical: updatedSkills,
                                  },
                                });
                                if (cvFormData) {
                                  setCvFormData({
                                    ...cvFormData,
                                    skills: {
                                      ...cvFormData.skills,
                                      technical: updatedSkills,
                                    },
                                  });
                                }
                              }}
                              sx={{
                                bgcolor: '#E3F2FD',
                                color: '#1565C0',
                                fontWeight: 600,
                                '& .MuiChip-deleteIcon': {
                                  color: '#1565C0',
                                  '&:hover': { color: '#0D47A1' },
                                },
                              }}
                            />
                          ))
                        ) : (
                          <Typography sx={{ color: '#6E819A', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            No hay skills técnicas detectadas
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 700, color: '#284D78', mb: 1, fontSize: '0.95rem' }}>
                        SKILLS PERSONALES ({advancedCvData.skills.personal.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, minHeight: 32 }}>
                        {advancedCvData.skills.personal.length > 0 ? (
                          advancedCvData.skills.personal.map((skill, index) => (
                            <Chip
                              key={`personal-skill-${index}`}
                              label={skill}
                              onDelete={() => {
                                const updatedSkills = advancedCvData.skills.personal.filter((_, i) => i !== index);
                                setAdvancedCvData({
                                  ...advancedCvData,
                                  skills: {
                                    ...advancedCvData.skills,
                                    personal: updatedSkills,
                                  },
                                });
                                if (cvFormData) {
                                  setCvFormData({
                                    ...cvFormData,
                                    skills: {
                                      ...cvFormData.skills,
                                      personal: updatedSkills,
                                    },
                                  });
                                }
                              }}
                              sx={{
                                bgcolor: '#F3E5F5',
                                color: '#6A1B9A',
                                fontWeight: 600,
                                '& .MuiChip-deleteIcon': {
                                  color: '#6A1B9A',
                                  '&:hover': { color: '#4A148C' },
                                },
                              }}
                            />
                          ))
                        ) : (
                          <Typography sx={{ color: '#6E819A', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            No hay skills personales detectadas
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </>
              )}

              {cvFormData && (
                <Box sx={{ mt: 3 }}>
                  <Typography sx={{ fontWeight: 700, color: '#1F3E69', mb: 1 }}>
                    Formulario Adaptado del CV
                  </Typography>

                  <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #C9D7E8', bgcolor: '#F9FCFF' }}>
                    <Typography sx={{ fontWeight: 700, color: '#1F3E69', mb: 1.5 }}>Perfil Profesional</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                      <TextField
                        label="Nombre completo"
                        value={cvFormData.profile.fullName}
                        onChange={(event) => updateProfileField('fullName', event.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Correo"
                        value={cvFormData.profile.email}
                        onChange={(event) => updateProfileField('email', event.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Telefono"
                        value={cvFormData.profile.phone}
                        onChange={(event) => updateProfileField('phone', event.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Ubicacion"
                        value={cvFormData.profile.location}
                        onChange={(event) => updateProfileField('location', event.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Titulo"
                        value={cvFormData.profile.title ?? ''}
                        onChange={(event) => updateProfileField('title', event.target.value)}
                        fullWidth
                        sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}
                      />
                      <TextField
                        label="Resumen profesional"
                        value={cvFormData.profile.professionalSummary}
                        onChange={(event) => updateProfileField('professionalSummary', event.target.value)}
                        multiline
                        minRows={3}
                        fullWidth
                        sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2.2, p: 2, borderRadius: 2, border: '1px solid #C9D7E8', bgcolor: '#F9FCFF' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, color: '#1F3E69' }}>Experiencia Laboral</Typography>
                      <Button size="small" variant="outlined" onClick={addExperience}>Agregar experiencia</Button>
                    </Box>

                    {cvFormData.experience.length === 0 && (
                      <Typography sx={{ color: '#5C6F86' }}>No se detectaron experiencias automaticamente. Puedes agregarlas manualmente.</Typography>
                    )}

                    {cvFormData.experience.map((experience, index) => (
                      <Box key={`experience-${index}`} sx={{ mt: 1.5, p: 1.5, border: '1px solid #D8E3F0', borderRadius: 1.5, bgcolor: '#FFFFFF' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                          <Typography sx={{ fontWeight: 700, color: '#284D78' }}>Experiencia #{index + 1}</Typography>
                          <Button size="small" color="error" onClick={() => removeExperience(index)}>Eliminar</Button>
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.2 }}>
                          <TextField
                            label="Empresa"
                            value={experience.company}
                            onChange={(event) => updateExperienceField(index, 'company', event.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Cargo"
                            value={experience.position}
                            onChange={(event) => updateExperienceField(index, 'position', event.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Fecha inicio"
                            value={experience.startDate}
                            onChange={(event) => updateExperienceField(index, 'startDate', event.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Fecha fin"
                            value={experience.endDate}
                            onChange={(event) => updateExperienceField(index, 'endDate', event.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Descripcion"
                            value={experience.description}
                            onChange={(event) => updateExperienceField(index, 'description', event.target.value)}
                            multiline
                            minRows={3}
                            fullWidth
                            sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ mt: 2.2, p: 2, borderRadius: 2, border: '1px solid #C9D7E8', bgcolor: '#F9FCFF' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, color: '#1F3E69' }}>Estudios</Typography>
                      <Button size="small" variant="outlined" onClick={addEducation}>Agregar estudio</Button>
                    </Box>

                    {cvFormData.education.length === 0 && (
                      <Typography sx={{ color: '#5C6F86' }}>No se detectaron estudios automaticamente. Puedes agregarlos manualmente.</Typography>
                    )}

                    {cvFormData.education.map((education, index) => (
                      <Box key={`education-${index}`} sx={{ mt: 1.5, p: 1.5, border: '1px solid #D8E3F0', borderRadius: 1.5, bgcolor: '#FFFFFF' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                          <Typography sx={{ fontWeight: 700, color: '#284D78' }}>Estudio #{index + 1}</Typography>
                          <Button size="small" color="error" onClick={() => removeEducation(index)}>Eliminar</Button>
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.2 }}>
                          <TextField
                            label="Institucion"
                            value={education.institution}
                            onChange={(event) => updateEducationField(index, 'institution', event.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Titulo / Grado"
                            value={education.degree}
                            onChange={(event) => updateEducationField(index, 'degree', event.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Estado"
                            value={education.status ?? ''}
                            onChange={(event) => updateEducationField(index, 'status', event.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Detalle"
                            value={education.details ?? ''}
                            onChange={(event) => updateEducationField(index, 'details', event.target.value)}
                            fullWidth
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ mt: 2.2, p: 2, borderRadius: 2, border: '1px solid #C9D7E8', bgcolor: '#F9FCFF' }}>
                    <Typography sx={{ fontWeight: 700, color: '#1F3E69', mb: 1.5 }}>Skills</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.2 }}>
                      <TextField
                        label="Skills tecnicas (separadas por coma)"
                        value={cvFormData.skills.technical.join(', ')}
                        onChange={(event) => updateSkills('technical', event.target.value)}
                        fullWidth
                        multiline
                        minRows={4}
                        maxRows={4}
                      />
                      <TextField
                        label="Skills personales (separadas por coma)"
                        value={cvFormData.skills.personal.join(', ')}
                        onChange={(event) => updateSkills('personal', event.target.value)}
                        fullWidth
                        multiline
                        minRows={4}
                        maxRows={4}
                      />
                    </Box>
                  </Box>
                </Box>
              )}

              {rawCvText && (
                <Box sx={{ mt: 3 }}>
                  <Typography sx={{ fontWeight: 700, color: '#1F3E69', mb: 1 }}>
                    Texto sin procesar del PDF (para inspección)
                  </Typography>
                  <TextField
                    value={rawCvText}
                    fullWidth
                    multiline
                    minRows={15}
                    slotProps={{
                      input: {
                        readOnly: true,
                      },
                    }}
                  />
                </Box>
              )}
            </Paper>
          ) : selectedMenuItem === 'Ver CV Actual' ? (
            <Paper
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 3,
                boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
              }}
            >
              <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 800, color: '#1F3E69' }}>
                Ver CV Actual
              </Typography>
              <Typography sx={{ mt: 1.2, color: '#5C6F86', maxWidth: 720 }}>
                Aquí se muestra tu CV actual. Esta es una vista de lectura únicamente.
              </Typography>

              {advancedCvData ? (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #C9D7E8', bgcolor: '#F9FCFF', mb: 2.2 }}>
                    <Typography sx={{ fontWeight: 700, color: '#1F3E69', mb: 1.5 }}>Perfil Profesional</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.85rem', color: '#6E819A', fontWeight: 600 }}>Nombre completo</Typography>
                        <Typography sx={{ color: '#1F3E69', fontWeight: 500 }}>{advancedCvData.profile.fullName}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.85rem', color: '#6E819A', fontWeight: 600 }}>Correo</Typography>
                        <Typography sx={{ color: '#1F3E69', fontWeight: 500 }}>{advancedCvData.profile.email}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.85rem', color: '#6E819A', fontWeight: 600 }}>Telefono</Typography>
                        <Typography sx={{ color: '#1F3E69', fontWeight: 500 }}>{advancedCvData.profile.phone}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.85rem', color: '#6E819A', fontWeight: 600 }}>Ubicacion</Typography>
                        <Typography sx={{ color: '#1F3E69', fontWeight: 500 }}>{advancedCvData.profile.location}</Typography>
                      </Box>
                      <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}>
                        <Typography sx={{ fontSize: '0.85rem', color: '#6E819A', fontWeight: 600 }}>Titulo profesional</Typography>
                        <Typography sx={{ color: '#1F3E69', fontWeight: 500 }}>{advancedCvData.profile.title || 'No especificado'}</Typography>
                      </Box>
                      <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}>
                        <Typography sx={{ fontSize: '0.85rem', color: '#6E819A', fontWeight: 600 }}>Resumen profesional</Typography>
                        <Typography sx={{ color: '#1F3E69', fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                          {advancedCvData.profile.professionalSummary || 'No especificado'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #C9D7E8', bgcolor: '#F9FCFF', mb: 2.2 }}>
                    <Typography sx={{ fontWeight: 700, color: '#1F3E69', mb: 1.5 }}>Experiencia Laboral</Typography>
                    {advancedCvData.experience.length === 0 ? (
                      <Typography sx={{ color: '#5C6F86' }}>No hay experiencias registradas</Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {advancedCvData.experience.map((experience, index) => (
                          <Card key={`experience-view-${index}`} sx={{ p: 1.5, border: '1px solid #D8E3F0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.8, gap: 1 }}>
                              <Box>
                                <Typography sx={{ fontWeight: 700, color: '#284D78' }}>{experience.position}</Typography>
                                <Typography sx={{ color: '#5C6F86', fontSize: '0.95rem' }}>{experience.company}</Typography>
                              </Box>
                              <Typography sx={{ fontSize: '0.85rem', color: '#6E819A', whiteSpace: 'nowrap' }}>
                                {experience.startDate} - {experience.endDate || 'Actualidad'}
                              </Typography>
                            </Box>
                            {experience.description && (
                              <Typography sx={{ color: '#1F3E69', fontSize: '0.95rem', mt: 0.8, whiteSpace: 'pre-wrap' }}>
                                {experience.description}
                              </Typography>
                            )}
                          </Card>
                        ))}
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #C9D7E8', bgcolor: '#F9FCFF', mb: 2.2 }}>
                    <Typography sx={{ fontWeight: 700, color: '#1F3E69', mb: 1.5 }}>Estudios</Typography>
                    {advancedCvData.education.length === 0 ? (
                      <Typography sx={{ color: '#5C6F86' }}>No hay estudios registrados</Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {advancedCvData.education.map((education, index) => (
                          <Card key={`education-view-${index}`} sx={{ p: 1.5, border: '1px solid #D8E3F0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                              <Box>
                                <Typography sx={{ fontWeight: 700, color: '#284D78' }}>{education.degree}</Typography>
                                <Typography sx={{ color: '#5C6F86', fontSize: '0.95rem' }}>{education.institution}</Typography>
                              </Box>
                              <Typography sx={{ fontSize: '0.85rem', color: '#6E819A', whiteSpace: 'nowrap' }}>
                                {education.status}
                              </Typography>
                            </Box>
                            {education.details && (
                              <Typography sx={{ color: '#1F3E69', fontSize: '0.9rem', mt: 0.8 }}>
                                {education.details}
                              </Typography>
                            )}
                          </Card>
                        ))}
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #C9D7E8', bgcolor: '#F9FCFF' }}>
                    <Typography sx={{ fontWeight: 700, color: '#1F3E69', mb: 1.5 }}>Skills</Typography>
                    <Box>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontSize: '0.85rem', color: '#6E819A', fontWeight: 600, mb: 0.8 }}>Tecnicas</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                          {advancedCvData.skills.technical.length > 0 ? (
                            advancedCvData.skills.technical.map((skill, index) => (
                              <Box
                                key={`tech-skill-${index}`}
                                sx={{
                                  bgcolor: '#E3F2FD',
                                  color: '#1565C0',
                                  px: 1.2,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.85rem',
                                  fontWeight: 500,
                                }}
                              >
                                {skill}
                              </Box>
                            ))
                          ) : (
                            <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>Sin skills tecnicas registradas</Typography>
                          )}
                        </Box>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.85rem', color: '#6E819A', fontWeight: 600, mb: 0.8 }}>Personales</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                          {advancedCvData.skills.personal.length > 0 ? (
                            advancedCvData.skills.personal.map((skill, index) => (
                              <Box
                                key={`personal-skill-${index}`}
                                sx={{
                                  bgcolor: '#F3E5F5',
                                  color: '#6A1B9A',
                                  px: 1.2,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.85rem',
                                  fontWeight: 500,
                                }}
                              >
                                {skill}
                              </Box>
                            ))
                          ) : (
                            <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>Sin skills personales registradas</Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2.2, p: 2, borderRadius: 2, border: '1px solid #C9D7E8', bgcolor: '#F9FCFF' }}>
                    <Typography sx={{ fontWeight: 700, color: '#1F3E69', mb: 1.5 }}>
                      Formacion y Cursos
                    </Typography>

                    <Box sx={{ display: 'grid', gap: 1.5 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.9rem', color: '#6E819A', fontWeight: 700, mb: 0.8 }}>
                          Cursos vistos ({learningCoursesForCv.viewed.length})
                        </Typography>
                        {learningCoursesForCv.viewed.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                            {learningCoursesForCv.viewed.map((course) => (
                              <Chip
                                key={`cv-viewed-course-${course.id}`}
                                label={course.title}
                                sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600 }}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>
                            Aun no tienes cursos vistos.
                          </Typography>
                        )}
                      </Box>

                      <Box>
                        <Typography sx={{ fontSize: '0.9rem', color: '#6E819A', fontWeight: 700, mb: 0.8 }}>
                          Cursos aprobados ({learningCoursesForCv.approved.length})
                        </Typography>
                        {learningCoursesForCv.approved.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                            {learningCoursesForCv.approved.map((course) => (
                              <Chip
                                key={`cv-approved-course-${course.id}`}
                                label={course.title}
                                sx={{ bgcolor: '#E8F5E9', color: '#1B5E20', fontWeight: 600 }}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>
                            Aun no tienes cursos aprobados.
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#FFF3E0', borderRadius: 2, border: '1px solid #FFB74D' }}>
                  <Typography sx={{ color: '#E65100', fontWeight: 600 }}>
                    ℹ️ No hay datos de CV disponibles. Por favor, carga un CV primero en la sección "Cargar Nuevo CV".
                  </Typography>
                </Box>
              )}
            </Paper>
          ) : selectedMenuItem === 'Actualizar Datos' ? (
            <Paper
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 3,
                boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
              }}
            >
              <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 800, color: '#1F3E69' }}>
                Actualizar Datos
              </Typography>
              <Typography sx={{ mt: 1.2, color: '#5C6F86', maxWidth: 720 }}>
                Edita tu información profesional. Los cambios se guardaran en tu perfil.
              </Typography>

              {cvFormData ? (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #C9D7E8', bgcolor: '#F9FCFF' }}>
                    <Typography sx={{ fontWeight: 700, color: '#1F3E69', mb: 1.5 }}>Perfil Profesional</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                      <TextField
                        label="Nombre completo"
                        value={cvFormData.profile.fullName}
                        onChange={(event) => updateProfileField('fullName', event.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Correo"
                        value={cvFormData.profile.email}
                        onChange={(event) => updateProfileField('email', event.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Telefono"
                        value={cvFormData.profile.phone}
                        onChange={(event) => updateProfileField('phone', event.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Ubicacion"
                        value={cvFormData.profile.location}
                        onChange={(event) => updateProfileField('location', event.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Titulo"
                        value={cvFormData.profile.title ?? ''}
                        onChange={(event) => updateProfileField('title', event.target.value)}
                        fullWidth
                        sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}
                      />
                      <TextField
                        label="Resumen profesional"
                        value={cvFormData.profile.professionalSummary}
                        onChange={(event) => updateProfileField('professionalSummary', event.target.value)}
                        multiline
                        minRows={3}
                        fullWidth
                        sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2.2, p: 2, borderRadius: 2, border: '1px solid #C9D7E8', bgcolor: '#F9FCFF' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, color: '#1F3E69' }}>Experiencia Laboral</Typography>
                      <Button size="small" variant="outlined" onClick={addExperience}>Agregar experiencia</Button>
                    </Box>

                    {cvFormData.experience.length === 0 && (
                      <Typography sx={{ color: '#5C6F86' }}>No se detectaron experiencias. Puedes agregarlas manualmente.</Typography>
                    )}

                    {cvFormData.experience.map((experience, index) => (
                      <Box key={`experience-edit-${index}`} sx={{ mt: 1.5, p: 1.5, border: '1px solid #D8E3F0', borderRadius: 1.5, bgcolor: '#FFFFFF' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                          <Typography sx={{ fontWeight: 700, color: '#284D78' }}>Experiencia #{index + 1}</Typography>
                          <Button size="small" color="error" onClick={() => removeExperience(index)}>Eliminar</Button>
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.2 }}>
                          <TextField
                            label="Empresa"
                            value={experience.company}
                            onChange={(event) => updateExperienceField(index, 'company', event.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Cargo"
                            value={experience.position}
                            onChange={(event) => updateExperienceField(index, 'position', event.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Fecha inicio"
                            value={experience.startDate}
                            onChange={(event) => updateExperienceField(index, 'startDate', event.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Fecha fin"
                            value={experience.endDate}
                            onChange={(event) => updateExperienceField(index, 'endDate', event.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Descripcion"
                            value={experience.description}
                            onChange={(event) => updateExperienceField(index, 'description', event.target.value)}
                            multiline
                            minRows={3}
                            fullWidth
                            sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ mt: 2.2, p: 2, borderRadius: 2, border: '1px solid #C9D7E8', bgcolor: '#F9FCFF' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, color: '#1F3E69' }}>Estudios</Typography>
                      <Button size="small" variant="outlined" onClick={addEducation}>Agregar estudio</Button>
                    </Box>

                    {cvFormData.education.length === 0 && (
                      <Typography sx={{ color: '#5C6F86' }}>No se detectaron estudios. Puedes agregarlos manualmente.</Typography>
                    )}

                    {cvFormData.education.map((education, index) => (
                      <Box key={`education-edit-${index}`} sx={{ mt: 1.5, p: 1.5, border: '1px solid #D8E3F0', borderRadius: 1.5, bgcolor: '#FFFFFF' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                          <Typography sx={{ fontWeight: 700, color: '#284D78' }}>Estudio #{index + 1}</Typography>
                          <Button size="small" color="error" onClick={() => removeEducation(index)}>Eliminar</Button>
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.2 }}>
                          <TextField
                            label="Institucion"
                            value={education.institution}
                            onChange={(event) => updateEducationField(index, 'institution', event.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Titulo / Grado"
                            value={education.degree}
                            onChange={(event) => updateEducationField(index, 'degree', event.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Estado"
                            value={education.status ?? ''}
                            onChange={(event) => updateEducationField(index, 'status', event.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Detalle"
                            value={education.details ?? ''}
                            onChange={(event) => updateEducationField(index, 'details', event.target.value)}
                            fullWidth
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ mt: 2.2, p: 2, borderRadius: 2, border: '1px solid #C9D7E8', bgcolor: '#F9FCFF' }}>
                    <Typography sx={{ fontWeight: 700, color: '#1F3E69', mb: 1.5 }}>Skills</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.2 }}>
                      <TextField
                        label="Skills tecnicas (separadas por coma)"
                        value={cvFormData.skills.technical.join(', ')}
                        onChange={(event) => updateSkills('technical', event.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                      />
                      <TextField
                        label="Skills personales (separadas por coma)"
                        value={cvFormData.skills.personal.join(', ')}
                        onChange={(event) => updateSkills('personal', event.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2.5, display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      onClick={handleSaveCvForm}
                      disabled={isSavingCv}
                      sx={{
                        bgcolor: '#173A68',
                        color: '#fff',
                        fontWeight: 700,
                        '&:hover': { bgcolor: '#112D51' },
                      }}
                    >
                      {isSavingCv ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setCvFormData(advancedCvData)}
                      sx={{
                        borderColor: '#1F3E69',
                        color: '#1F3E69',
                        fontWeight: 700,
                        '&:hover': { borderColor: '#173A68', bgcolor: '#EDF4FF' },
                      }}
                    >
                      DESCARTAR
                    </Button>
                  </Box>

                  {saveSuccessMessage && (
                    <Typography sx={{ mt: 1.5, color: '#166534', fontWeight: 600 }}>
                      {saveSuccessMessage}
                    </Typography>
                  )}

                  {saveErrorMessage && (
                    <Typography sx={{ mt: 1.5, color: '#B42318', fontWeight: 600 }}>
                      {saveErrorMessage}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#FFF3E0', borderRadius: 2, border: '1px solid #FFB74D' }}>
                  <Typography sx={{ color: '#E65100', fontWeight: 600 }}>
                    ℹ️ No hay datos de CV disponibles. Por favor, carga un CV primero en la sección "Cargar Nuevo CV".
                  </Typography>
                </Box>
              )}
            </Paper>
          ) : selectedMenuItem === 'Tecnica' ? (
            <AssessmentTestsPanel
              activeTab="Tecnica"
              onTestCompleted={() => {
                void handleAssessmentTestCompleted('TECHNICAL');
              }}
            />
          ) : selectedMenuItem === 'Psicotecnica' ? (
            <AssessmentTestsPanel
              activeTab="Psicotecnica"
              onTestCompleted={() => {
                void handleAssessmentTestCompleted('PSYCHOTECHNICAL');
              }}
            />
          ) : selectedMenuItem === 'Resultados' && openSections['EVALUACION PERFIL'] ? (
            <AssessmentResultsPanel
              onRoadmapGenerated={handleRoadmapGenerated}
              onContinueToCourses={handleContinueToLearningRoute}
            />
          ) : selectedMenuItem === 'Mi Ruta de Cursos' ? (
            <LearningRoadmapPanel
              mode="all"
              refreshToken={learningRoadmapRefreshToken}
            />
          ) : selectedMenuItem === 'Pendientes' ? (
            <LearningRoadmapPanel
              mode="pending"
              refreshToken={learningRoadmapRefreshToken}
            />
          ) : selectedMenuItem === 'En Ejecucion' ? (
            <LearningRoadmapPanel
              mode="in-progress"
              refreshToken={learningRoadmapRefreshToken}
            />
          ) : selectedMenuItem === 'Resultados (Diplomas)' ? (
            <LearningRoadmapPanel
              mode="completed"
              refreshToken={learningRoadmapRefreshToken}
            />
          ) : selectedMenuItem === 'Feedback de Reclutador' ? (
            <Paper
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 3,
                boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
              }}
            >
              <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 800, color: '#1F3E69' }}>
                Feedback de Reclutador
              </Typography>
              <Typography sx={{ mt: 1.2, color: '#5C6F86', maxWidth: 760 }}>
                Aqui encuentras observaciones de reclutadores en tus etapas de seleccionado, finalista y aceptado.
              </Typography>

              {loadingTalentFeedback ? (
                <Box sx={{ mt: 2.2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography sx={{ color: '#5C6F86' }}>Cargando feedback...</Typography>
                </Box>
              ) : talentFeedbackError ? (
                <Typography sx={{ mt: 2.2, color: '#B42318', fontWeight: 700 }}>
                  {talentFeedbackError}
                </Typography>
              ) : talentFeedback.length === 0 ? (
                <Typography sx={{ mt: 2.2, color: '#5C6F86' }}>
                  Aun no tienes feedback registrado por reclutadores.
                </Typography>
              ) : (
                <Box sx={{ mt: 2.2, display: 'grid', gap: 1.2 }}>
                  {talentFeedback.map((item) => (
                    <Card key={item.applicationId} sx={{ border: '1px solid #D8E3F0' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontWeight: 800, color: '#173A68' }}>
                            {item.vacancyTitle}
                          </Typography>
                          <Chip
                            size="small"
                            label={`Etapa: ${item.stage}`}
                            sx={{ bgcolor: '#EAF3FF', color: '#1F3E69' }}
                          />
                        </Box>
                        <Typography sx={{ mt: 1, color: '#314A66' }}>
                          {item.feedback}
                        </Typography>
                        <Typography sx={{ mt: 1, color: '#6D7F94', fontSize: '0.82rem' }}>
                          Fecha: {new Date(item.createdAt).toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          ) : selectedMenuItem === 'Editar Skills' ? (
            <Paper
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 3,
                boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
              }}
            >
              <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 800, color: '#1F3E69' }}>
                Editar Skills
              </Typography>
              <Typography sx={{ mt: 1.2, color: '#5C6F86', maxWidth: 720 }}>
                Administra tus skills técnicas y personales. Puedes agregar, editar o eliminar skills según corresponda.
              </Typography>

              {advancedCvData ? (
                <Box sx={{ mt: 3, p: 2.5, borderRadius: 2, border: '2px solid #1F3E69', bgcolor: '#F0F6FF' }}>
                  <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 2, fontSize: '1.1rem' }}>
                    🎯 Skills Detectadas del CV
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 700, color: '#284D78', mb: 1, fontSize: '0.95rem' }}>
                      SKILLS TÉCNICAS ({advancedCvData.skills.technical.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, minHeight: 32 }}>
                      {advancedCvData.skills.technical.length > 0 ? (
                        advancedCvData.skills.technical.map((skill, index) => (
                          <Chip
                            key={`tech-skill-edit-${index}`}
                            label={skill}
                            onDelete={() => {
                              const updatedSkills = advancedCvData.skills.technical.filter((_, i) => i !== index);
                              setAdvancedCvData({
                                ...advancedCvData,
                                skills: {
                                  ...advancedCvData.skills,
                                  technical: updatedSkills,
                                },
                              });
                              if (cvFormData) {
                                setCvFormData({
                                  ...cvFormData,
                                  skills: {
                                    ...cvFormData.skills,
                                    technical: updatedSkills,
                                  },
                                });
                              }
                            }}
                            sx={{
                              bgcolor: '#E3F2FD',
                              color: '#1565C0',
                              fontWeight: 600,
                              '& .MuiChip-deleteIcon': {
                                color: '#1565C0',
                                '&:hover': { color: '#0D47A1' },
                              },
                            }}
                          />
                        ))
                      ) : (
                        <Typography sx={{ color: '#6E819A', fontSize: '0.9rem', fontStyle: 'italic' }}>
                          No hay skills técnicas detectadas
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#284D78', mb: 1, fontSize: '0.95rem' }}>
                      SKILLS PERSONALES ({advancedCvData.skills.personal.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, minHeight: 32 }}>
                      {advancedCvData.skills.personal.length > 0 ? (
                        advancedCvData.skills.personal.map((skill, index) => (
                          <Chip
                            key={`personal-skill-edit-${index}`}
                            label={skill}
                            onDelete={() => {
                              const updatedSkills = advancedCvData.skills.personal.filter((_, i) => i !== index);
                              setAdvancedCvData({
                                ...advancedCvData,
                                skills: {
                                  ...advancedCvData.skills,
                                  personal: updatedSkills,
                                },
                              });
                              if (cvFormData) {
                                setCvFormData({
                                  ...cvFormData,
                                  skills: {
                                    ...cvFormData.skills,
                                    personal: updatedSkills,
                                  },
                                });
                              }
                            }}
                            sx={{
                              bgcolor: '#F3E5F5',
                              color: '#6A1B9A',
                              fontWeight: 600,
                              '& .MuiChip-deleteIcon': {
                                color: '#6A1B9A',
                                '&:hover': { color: '#4A148C' },
                              },
                            }}
                          />
                        ))
                      ) : (
                        <Typography sx={{ color: '#6E819A', fontSize: '0.9rem', fontStyle: 'italic' }}>
                          No hay skills personales detectadas
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mt: 3, p: 2.5, borderRadius: 2, border: '1px solid #D8E3F0', bgcolor: '#FFFFFF' }}>
                    <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 1.5, fontSize: '1rem' }}>
                      Skills guardadas en backend
                    </Typography>
                    {isLoadingProfileSkills ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={18} />
                        <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>Cargando skills...</Typography>
                      </Box>
                    ) : profileSkills.length > 0 ? (
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                          gap: 1,
                        }}
                      >
                        {profileSkills.map((userSkill) => renderPersistedSkillCard(userSkill, 'db-skill'))}
                      </Box>
                    ) : (
                      <Typography sx={{ color: '#6E819A', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        Aun no hay skills persistidas en backend.
                      </Typography>
                    )}
                  </Box>

                  {onboardingModeEnabled && (
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
                      <Button
                        variant="contained"
                        onClick={handleConfirmSkillsAndContinue}
                        disabled={!canConfirmSkillsAndContinue || isConfirmingSkills}
                        sx={{
                          bgcolor: '#173A68',
                          color: '#fff',
                          fontWeight: 700,
                          '&:hover': { bgcolor: '#112D51' },
                        }}
                      >
                        {isConfirmingSkills
                          ? 'GUARDANDO Y ABRIENDO PRUEBA TECNICA...'
                          : 'CONFIRMAR SKILLS Y CONTINUAR A PRUEBA TECNICA'}
                      </Button>
                      {!canConfirmSkillsAndContinue && !isConfirmingSkills && (
                        <Typography sx={{ color: '#B42318', fontWeight: 600, alignSelf: 'center' }}>
                          Para continuar necesitas al menos una skill tecnica detectada en CV o guardada en backend.
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#FFF3E0', borderRadius: 2, border: '1px solid #FFB74D' }}>
                  <Typography sx={{ color: '#E65100', fontWeight: 600 }}>
                    ℹ️ No hay datos de CV disponibles. Por favor, carga un CV primero en la sección "Cargar Nuevo CV".
                  </Typography>
                </Box>
              )}
            </Paper>
          ) : selectedMenuItem === 'Ver Informe de Skills' || selectedMenuItem === 'Resultados' ? (
            <Paper
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 3,
                boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
              }}
            >
              <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 800, color: '#1F3E69' }}>
                Informe Inicial del Perfil
              </Typography>
              <Typography sx={{ mt: 1.2, color: '#5C6F86', maxWidth: 820 }}>
                Este informe resume el diagnóstico inicial obtenido desde tu CV. Incluye skills técnicas/personales y una métrica de completitud para orientar el plan de mejora.
              </Typography>

              {isLoadingDiagnostic ? (
                <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <CircularProgress size={22} />
                  <Typography sx={{ color: '#1F3E69', fontWeight: 600 }}>Cargando diagnóstico...</Typography>
                </Box>
              ) : latestDiagnostic ? (
                <Box sx={{ mt: 3, display: 'grid', gap: 2 }}>
                  <Card sx={{ border: '1px solid #D8E3F0' }}>
                    <CardContent>
                      <Typography sx={{ fontWeight: 800, color: '#1F3E69' }}>Resumen del diagnóstico</Typography>
                      <Typography sx={{ mt: 1, color: '#2B3F5E' }}>
                        {latestDiagnostic.summary || 'Diagnóstico guardado sin resumen textual.'}
                      </Typography>
                      <Typography sx={{ mt: 1, color: '#5C6F86', fontSize: '0.9rem' }}>
                        Fecha: {new Date(latestDiagnostic.createdAt).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                    <Card sx={{ border: '1px solid #D8E3F0' }}>
                      <CardContent>
                        <Typography color="text.secondary">Skills técnicas</Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: '#1565C0' }}>
                          {latestDiagnostic.technicalSkills.length}
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card sx={{ border: '1px solid #D8E3F0' }}>
                      <CardContent>
                        <Typography color="text.secondary">Skills personales</Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: '#6A1B9A' }}>
                          {latestDiagnostic.personalSkills.length}
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card sx={{ border: '1px solid #D8E3F0' }}>
                      <CardContent>
                        <Typography color="text.secondary">Texto CV procesado</Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: '#1F3E69' }}>
                          {latestDiagnostic.extractedTextLength}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>

                  <Card sx={{ border: '1px solid #D8E3F0' }}>
                    <CardContent>
                      <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 2 }}>Distribución de skills</Typography>
                      {(() => {
                        const total =
                          latestDiagnostic.technicalSkills.length + latestDiagnostic.personalSkills.length;
                        const technicalPct = total > 0
                          ? Math.round((latestDiagnostic.technicalSkills.length / total) * 100)
                          : 0;
                        const personalPct = total > 0 ? 100 - technicalPct : 0;
                        return (
                          <>
                            <Typography sx={{ color: '#1565C0', fontWeight: 700 }}>
                              Técnicas: {technicalPct}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={technicalPct}
                              sx={{
                                mt: 0.7,
                                height: 9,
                                borderRadius: 8,
                                bgcolor: '#E1E8F0',
                                '& .MuiLinearProgress-bar': { bgcolor: '#1565C0' },
                              }}
                            />
                            <Typography sx={{ mt: 2, color: '#6A1B9A', fontWeight: 700 }}>
                              Personales: {personalPct}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={personalPct}
                              sx={{
                                mt: 0.7,
                                height: 9,
                                borderRadius: 8,
                                bgcolor: '#E1E8F0',
                                '& .MuiLinearProgress-bar': { bgcolor: '#6A1B9A' },
                              }}
                            />
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <Card sx={{ border: '1px solid #D8E3F0' }}>
                    <CardContent>
                      <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 2 }}>
                        Skills persistidas en backend
                      </Typography>
                      {isLoadingProfileSkills ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={18} />
                          <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>Cargando skills...</Typography>
                        </Box>
                      ) : profileSkills.length > 0 ? (
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                            gap: 1,
                          }}
                        >
                          {profileSkills.map((userSkill) => renderPersistedSkillCard(userSkill, 'report-db-skill'))}
                        </Box>
                      ) : (
                        <Typography sx={{ color: '#6E819A', fontSize: '0.95rem' }}>
                          No hay skills guardadas en backend para mostrar.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              ) : (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#FFF3E0', borderRadius: 2, border: '1px solid #FFB74D' }}>
                  <Typography sx={{ color: '#E65100', fontWeight: 600 }}>
                    No hay diagnóstico guardado todavía. Carga un CV y usa Guardar Cambios para generar el informe.
                  </Typography>
                </Box>
              )}
            </Paper>
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
                Esta vista es temporal para que el equipo de diseno defina el layout final de este modulo.
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};
