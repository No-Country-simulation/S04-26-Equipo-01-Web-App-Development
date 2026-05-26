import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import { AutoAwesomeOutlined } from '@mui/icons-material';
import { consolidateMyAssessment } from '../services/assessment.service';
import { listCourses } from '../services/course.service';
import { generateMyLearningPath, getMyLearningPaths } from '../services/learning.service';
import type { Course } from '../types/course.types';
import type { LearningModule, LearningPath, ModuleStatus } from '../types/learning.types';

interface LearningRoadmapPanelProps {
  mode: 'all' | 'pending' | 'in-progress' | 'completed';
  refreshToken?: number;
}

const resolveModuleStatus = (module: LearningModule): ModuleStatus => {
  return module.progress?.[0]?.status ?? 'PENDING';
};

const filterModulesByMode = (
  modules: LearningModule[],
  mode: LearningRoadmapPanelProps['mode'],
): LearningModule[] => {
  if (mode === 'all') {
    return modules;
  }

  const statusByMode: Record<Exclude<LearningRoadmapPanelProps['mode'], 'all'>, ModuleStatus> = {
    pending: 'PENDING',
    'in-progress': 'IN_PROGRESS',
    completed: 'COMPLETED',
  };

  return modules.filter((module) => resolveModuleStatus(module) === statusByMode[mode]);
};

export const LearningRoadmapPanel = ({ mode, refreshToken }: LearningRoadmapPanelProps) => {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [publishedCourses, setPublishedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const fetchLearningPaths = async (): Promise<LearningPath[]> => {
    try {
      return await getMyLearningPaths();
    } catch (error) {
      console.error('Error loading learning paths:', error);
      return [];
    }
  };

  const fetchPublishedCourses = async (): Promise<Course[]> => {
    try {
      return await listCourses({ published: true });
    } catch (error) {
      console.error('Error loading published courses:', error);
      return [];
    }
  };

  const loadLearningPaths = async () => {
    const paths = await fetchLearningPaths();
    setLearningPaths(paths);

    const courses = await fetchPublishedCourses();
    setPublishedCourses(courses);
  };

  useEffect(() => {
    let isActive = true;

    void Promise.all([fetchLearningPaths(), fetchPublishedCourses()])
      .then(([paths, courses]) => {
        if (isActive) {
          setLearningPaths(paths);
          setPublishedCourses(courses);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [refreshToken]);

  const handleGenerateRoadmap = async () => {
    try {
      setIsGeneratingRoadmap(true);
      setGenerateError(null);
      setGenerateMessage(null);

      await consolidateMyAssessment();
      await generateMyLearningPath({});
      await loadLearningPaths();

      setGenerateMessage('Ruta generada con exito a partir de tus resultados de pruebas.');
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'No se pudo generar la ruta. Completa pruebas tecnica y psicotecnica primero.';
      setGenerateError(message);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const latestPath = learningPaths[0] ?? null;
  const modules = useMemo(() => {
    if (!latestPath?.modules) {
      return [];
    }

    return filterModulesByMode(latestPath.modules, mode);
  }, [latestPath, mode]);

  const scheduledWorkshops = useMemo(
    () =>
      publishedCourses.flatMap((course) =>
        (course.meetingLinks ?? []).map((meetingLink) => ({
          id: meetingLink.id,
          courseId: course.id,
          courseTitle: course.title,
          courseDescription: course.description,
          url: meetingLink.url,
          platform: meetingLink.platform,
          scheduledAt: meetingLink.scheduledAt ?? null,
          notes: meetingLink.notes,
        })),
      ),
    [publishedCourses],
  );

  const workshopsByMode = useMemo(() => {
    const now = new Date();

    return scheduledWorkshops.filter((workshop) => {
      if (!workshop.scheduledAt) {
        return mode === 'pending' || mode === 'all';
      }

      const scheduledDate = new Date(workshop.scheduledAt);
      if (Number.isNaN(scheduledDate.getTime())) {
        return mode === 'pending' || mode === 'all';
      }

      if (mode === 'all') {
        return true;
      }

      if (mode === 'pending') {
        return scheduledDate > now;
      }

      if (mode === 'in-progress') {
        const diffMs = Math.abs(scheduledDate.getTime() - now.getTime());
        const threeHoursMs = 3 * 60 * 60 * 1000;
        return diffMs <= threeHoursMs;
      }

      return scheduledDate < now;
    });
  }, [scheduledWorkshops, mode]);

  const formatDateTime = (value?: string | null): string => {
    if (!value) {
      return 'Por programar';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Por programar';
    }

    return parsed.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openWorkshopRoom = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyWorkshopLink = async (url: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // noop
    }
  };

  const titleByMode: Record<LearningRoadmapPanelProps['mode'], string> = {
    all: 'Mi Ruta de Cursos',
    pending: 'Cursos Pendientes',
    'in-progress': 'Cursos En Ejecucion',
    completed: 'Resultados y Diplomas',
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 5 }}>
        <CircularProgress size={24} />
        <Typography sx={{ color: '#5C6F86' }}>
          Cargando ruta de aprendizaje...
        </Typography>
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        p: { xs: 3, md: 5 },
        borderRadius: 3,
        boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
      }}
    >
      <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 800, color: '#1F3E69' }}>
        {titleByMode[mode]}
      </Typography>

      <Typography sx={{ mt: 1.2, color: '#5C6F86', maxWidth: 820 }}>
        Ruta recomendada en base a tu assessment consolidado y cursos publicados disponibles para talento.
      </Typography>

      {mode === 'all' && (
        <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeOutlined />}
            onClick={handleGenerateRoadmap}
            disabled={isGeneratingRoadmap}
            sx={{
              textTransform: 'none',
              bgcolor: '#1F3E69',
              fontWeight: 700,
              '&:hover': { bgcolor: '#1D3C63' },
            }}
          >
            {isGeneratingRoadmap ? 'Generando ruta...' : 'Generar Ruta de Cursos'}
          </Button>
        </Box>
      )}

      {generateMessage && (
        <Typography sx={{ mt: 2, color: '#166534', fontWeight: 600 }}>
          {generateMessage}
        </Typography>
      )}

      {generateError && (
        <Typography sx={{ mt: 2, color: '#B42318', fontWeight: 600 }}>
          {generateError}
        </Typography>
      )}

      {!latestPath ? (
        <Box sx={{ mt: 3, p: 2, bgcolor: '#FFF3E0', borderRadius: 2, border: '1px solid #FFB74D' }}>
          <Typography sx={{ color: '#E65100', fontWeight: 600 }}>
            Aun no tienes una ruta generada. Completa tus pruebas y usa Generar Ruta de Cursos.
          </Typography>
        </Box>
      ) : (
        <>
          <Card sx={{ mt: 3, border: '1px solid #D8E3F0' }}>
            <CardContent>
              <Typography sx={{ fontWeight: 800, color: '#1F3E69' }}>
                {latestPath.title}
              </Typography>
              <Typography sx={{ mt: 1, color: '#5C6F86' }}>
                {latestPath.objective || 'Fortalecer habilidades prioritarias para tu perfil.'}
              </Typography>
              <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {latestPath.recommendedTrack && (
                  <Chip label={`Track: ${latestPath.recommendedTrack}`} sx={{ bgcolor: '#E3F2FD', color: '#1565C0' }} />
                )}
                {latestPath.confidence !== undefined && (
                  <Chip label={`Confianza: ${latestPath.confidence}%`} sx={{ bgcolor: '#E8F5E9', color: '#166534' }} />
                )}
              </Box>
            </CardContent>
          </Card>

          {modules.length === 0 ? (
            <Box sx={{ mt: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #D8E3F0' }}>
              <Typography sx={{ color: '#5C6F86', fontWeight: 600 }}>
                No hay modulos para este filtro actualmente.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 3, display: 'grid', gap: 1.5 }}>
              {modules.map((module) => {
                const moduleStatus = resolveModuleStatus(module);
                const progress = module.progress?.[0]?.progress ?? 0;

                return (
                  <Card key={module.id} sx={{ border: '1px solid #D8E3F0' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 2 }}>
                        <Box>
                          <Typography sx={{ fontWeight: 700, color: '#1F3E69' }}>
                            {module.order}. {module.title}
                          </Typography>
                          <Typography sx={{ mt: 0.5, color: '#5C6F86' }}>
                            {module.description}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${moduleStatus} - ${progress}%`}
                          sx={{
                            bgcolor:
                              moduleStatus === 'COMPLETED'
                                ? '#E8F5E9'
                                : moduleStatus === 'IN_PROGRESS'
                                  ? '#E3F2FD'
                                  : '#FFF3E0',
                            color:
                              moduleStatus === 'COMPLETED'
                                ? '#166534'
                                : moduleStatus === 'IN_PROGRESS'
                                  ? '#1565C0'
                                  : '#E65100',
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          <Typography sx={{ mt: 4, fontWeight: 800, color: '#1F3E69', fontSize: '1.1rem' }}>
            Talleres Programados (Cursos Publicados)
          </Typography>

          {workshopsByMode.length === 0 ? (
            <Box sx={{ mt: 1.5, p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #D8E3F0' }}>
              <Typography sx={{ color: '#5C6F86', fontWeight: 600 }}>
                No hay talleres disponibles para este filtro.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 2, display: 'grid', gap: 1.2 }}>
              {workshopsByMode.map((workshop) => (
                <Card key={workshop.id} sx={{ border: '1px solid #D8E3F0' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 2, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: '#1F3E69' }}>
                          {workshop.courseTitle}
                        </Typography>
                        <Typography sx={{ mt: 0.5, color: '#5C6F86' }}>
                          {workshop.courseDescription || 'Taller de curso publicado'}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip label={`Plataforma: ${workshop.platform}`} sx={{ bgcolor: '#E3F2FD', color: '#1565C0' }} />
                          <Chip label={`Fecha: ${formatDateTime(workshop.scheduledAt)}`} sx={{ bgcolor: '#FFF3E0', color: '#E65100' }} />
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          onClick={() => openWorkshopRoom(workshop.url)}
                          sx={{ textTransform: 'none', bgcolor: '#1F3E69', '&:hover': { bgcolor: '#1D3C63' } }}
                        >
                          Entrar a sala
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            void copyWorkshopLink(workshop.url);
                          }}
                          sx={{ textTransform: 'none' }}
                        >
                          Copiar enlace
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};
