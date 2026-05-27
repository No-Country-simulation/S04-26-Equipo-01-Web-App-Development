import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

import {
  addCourseMeetingLink,
  addCourseModule,
  approveCourse,
  archiveCourse,
  createCourse,
  deleteCourseMeetingLink,
  deleteCourseModule,
  listCourses,
  updateCourse,
} from '../../services/course.service';
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

type AcademyAdminTab = 'Cursos' | 'Talleres';

interface AdminAcademyPanelProps {
  tab: AcademyAdminTab;
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

export const AdminAcademyPanel = ({ tab }: AdminAcademyPanelProps) => {
  const [academyCourses, setAcademyCourses] = useState<Course[]>([]);
  const [loadingAcademyCourses, setLoadingAcademyCourses] = useState(false);
  const [courseFilters, setCourseFilters] = useState<{ published: boolean }>({
    published: false,
  });
  const [courseForm, setCourseForm] = useState<CourseFormState>(INITIAL_COURSE_FORM);
  const [courseModuleForm, setCourseModuleForm] = useState<CourseModuleFormState>(INITIAL_COURSE_MODULE_FORM);
  const [courseMeetingForm, setCourseMeetingForm] = useState<CourseMeetingFormState>(INITIAL_COURSE_MEETING_FORM);
  const [academyFeedback, setAcademyFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [savingCourseAction, setSavingCourseAction] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const [workshopPlatformFilter, setWorkshopPlatformFilter] = useState<'ALL' | MeetingPlatformType>('ALL');
  const [workshopCourseFilter, setWorkshopCourseFilter] = useState('ALL');

  const loadAcademyCourses = async () => {
    setLoadingAcademyCourses(true);
    setAcademyFeedback(null);
    try {
      const courses = await listCourses({ published: courseFilters.published });
      setAcademyCourses(courses);

      if (courses.length === 0) {
        setExpandedCourseId(null);
        return;
      }

      if (!expandedCourseId || !courses.some((course) => course.id === expandedCourseId)) {
        setExpandedCourseId(courses[0].id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar los cursos de la academia.';
      setAcademyFeedback({ type: 'error', message });
      setAcademyCourses([]);
      setExpandedCourseId(null);
    } finally {
      setLoadingAcademyCourses(false);
    }
  };

  useEffect(() => {
    void loadAcademyCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseFilters.published]);

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
      setAcademyFeedback({ type: 'success', message: 'Curso creado correctamente.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el curso.';
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
        durationMin: courseModuleForm.durationMin ? Number(courseModuleForm.durationMin) : undefined,
      };

      await addCourseModule(courseModuleForm.courseId, payload);
      setCourseModuleForm((prev) => ({
        ...INITIAL_COURSE_MODULE_FORM,
        courseId: prev.courseId,
      }));
      setExpandedCourseId(courseModuleForm.courseId);
      await loadAcademyCourses();
      setAcademyFeedback({ type: 'success', message: 'Modulo agregado al curso.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo agregar el modulo.';
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

    const scheduledAtCandidate = new Date(`${courseMeetingForm.scheduledDate}T${courseMeetingForm.scheduledTime}`);

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
      setAcademyFeedback({ type: 'success', message: 'Link de reunion agregado al curso.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo agregar el link.';
      setAcademyFeedback({ type: 'error', message });
    } finally {
      setSavingCourseAction(false);
    }
  };

  const changeCourseStatus = async (courseId: string, status: CourseStatusType) => {
    setSavingCourseAction(true);
    setAcademyFeedback(null);
    try {
      await updateCourse(courseId, { status });
      await loadAcademyCourses();
      setAcademyFeedback({ type: 'success', message: 'Estado del curso actualizado.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el estado del curso.';
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
      setAcademyFeedback({ type: 'success', message: 'Curso aprobado y publicado.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo aprobar el curso.';
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
      setAcademyFeedback({ type: 'success', message: 'Curso archivado correctamente.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo archivar el curso.';
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
      setAcademyFeedback({ type: 'success', message: 'Modulo eliminado del curso.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el modulo.';
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
      setAcademyFeedback({ type: 'success', message: 'Link eliminado del curso.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el link.';
      setAcademyFeedback({ type: 'error', message });
    } finally {
      setSavingCourseAction(false);
    }
  };

  const scheduledWorkshops = useMemo(
    () =>
      academyCourses.flatMap((course) =>
        (course.meetingLinks || []).map((meetingLink) => ({
          id: meetingLink.id,
          url: meetingLink.url,
          platform: meetingLink.platform,
          notes: meetingLink.notes,
          scheduledAt: meetingLink.scheduledAt,
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
        const matchesPlatform = workshopPlatformFilter === 'ALL' || workshop.platform === workshopPlatformFilter;
        const matchesCourse = workshopCourseFilter === 'ALL' || workshop.courseId === workshopCourseFilter;
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

      setAcademyFeedback({
        type: 'success',
        message: 'Enlace del taller copiado. Ya puedes compartirlo.',
      });
    } catch {
      setAcademyFeedback({
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
    const body = encodeURIComponent(`Hola,\n\nTe comparto el acceso al taller "${courseTitle}":\n${url}\n\nSaludos.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const renderCourses = () => (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' }, fontWeight: 800, color: '#1F3E69' }}>
          Academia Pro - Cursos
        </Typography>
        <Typography sx={{ mt: 0.8, color: '#5C6F86' }}>
          Gestiona cursos para toda la red desde el panel admin, incluyendo publicacion, modulos y enlaces de talleres en vivo.
        </Typography>
      </Paper>

      {academyFeedback && (
        <Alert severity={academyFeedback.type === 'error' ? 'error' : academyFeedback.type === 'success' ? 'success' : 'info'}>
          {academyFeedback.message}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 800, color: '#1F3E69' }}>Listado de cursos</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant={courseFilters.published ? 'outlined' : 'contained'} onClick={() => setCourseFilters({ published: false })} sx={{ textTransform: 'none' }}>
              Todos
            </Button>
            <Button variant={courseFilters.published ? 'contained' : 'outlined'} onClick={() => setCourseFilters({ published: true })} sx={{ textTransform: 'none' }}>
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
            No hay cursos registrados.
          </Typography>
        ) : (
          <Box sx={{ mt: 1.5, display: 'grid', gap: 1.1 }}>
            {academyCourses.map((course) => {
              const isExpanded = expandedCourseId === course.id;
              const canApprove = course.status === CourseStatus.PENDING_REVIEW;

              return (
                <Paper key={course.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #D8E3F0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800, color: '#173A68' }}>{course.title}</Typography>
                      <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>{course.description || 'Sin descripcion'}</Typography>
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
                      <Button size="small" variant="outlined" onClick={() => void changeCourseStatus(course.id, CourseStatus.PENDING_REVIEW)} disabled={savingCourseAction}>
                        Enviar a revision
                      </Button>
                      {canApprove && (
                        <Button size="small" variant="contained" onClick={() => void publishCourseAsAdmin(course.id)} disabled={savingCourseAction}>
                          Publicar
                        </Button>
                      )}
                      <Button size="small" color="error" variant="outlined" onClick={() => void removeCourseByArchiving(course.id)} disabled={savingCourseAction}>
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
                              <Typography sx={{ color: '#173A68', fontWeight: 700 }}>#{module.order} {module.title}</Typography>
                              <Button color="error" size="small" onClick={() => void removeModule(course.id, module.id)}>
                                Eliminar
                              </Button>
                            </Box>
                            <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>{module.description || 'Sin descripcion'}</Typography>
                          </Paper>
                        ))}
                        {(!course.modules || course.modules.length === 0) && <Typography sx={{ color: '#5C6F86' }}>Este curso aun no tiene modulos.</Typography>}
                      </Box>

                      <Typography sx={{ fontWeight: 700, color: '#1F3E69' }}>Links de talleres</Typography>
                      <Box sx={{ display: 'grid', gap: 0.8 }}>
                        {(course.meetingLinks || []).map((meetingLink) => (
                          <Paper key={meetingLink.id} sx={{ p: 1.1, borderRadius: 1.4, border: '1px solid #E4ECF6' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ color: '#173A68', fontWeight: 700 }}>{meetingLink.platform}</Typography>
                              <Button color="error" size="small" onClick={() => void removeMeetingLink(course.id, meetingLink.id)}>
                                Eliminar
                              </Button>
                            </Box>
                            <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem' }}>{meetingLink.url}</Typography>
                          </Paper>
                        ))}
                        {(!course.meetingLinks || course.meetingLinks.length === 0) && <Typography sx={{ color: '#5C6F86' }}>Este curso aun no tiene enlaces de taller.</Typography>}
                      </Box>
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>
        )}
      </Paper>

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
            <TextField label="Fecha del taller" size="small" type="date" slotProps={{ inputLabel: { shrink: true } }} value={courseMeetingForm.scheduledDate} onChange={(event) => setCourseMeetingForm((prev) => ({ ...prev, scheduledDate: event.target.value }))} />
            <TextField label="Hora del taller" size="small" type="time" slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 300 } }} value={courseMeetingForm.scheduledTime} onChange={(event) => setCourseMeetingForm((prev) => ({ ...prev, scheduledTime: event.target.value }))} />
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
    </Box>
  );

  const renderWorkshops = () => (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' }, fontWeight: 800, color: '#1F3E69' }}>
          Academia Pro - Talleres
        </Typography>
        <Typography sx={{ mt: 0.8, color: '#5C6F86' }}>
          Gestiona talleres en vivo publicados desde cursos y comparte el acceso a talento y empresas.
        </Typography>
      </Paper>

      {academyFeedback && (
        <Alert severity={academyFeedback.type === 'error' ? 'error' : academyFeedback.type === 'success' ? 'success' : 'info'}>
          {academyFeedback.message}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 800, color: '#1F3E69' }}>Talleres programados</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label="Plataforma"
              value={workshopPlatformFilter}
              onChange={(event) => setWorkshopPlatformFilter(event.target.value as 'ALL' | MeetingPlatformType)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="ALL">Todas</MenuItem>
              {Object.values(MeetingPlatform).map((platform) => (
                <MenuItem key={`filter-platform-${platform}`} value={platform}>{platform}</MenuItem>
              ))}
            </TextField>

            <TextField select size="small" label="Curso" value={workshopCourseFilter} onChange={(event) => setWorkshopCourseFilter(event.target.value)} sx={{ minWidth: 220 }}>
              <MenuItem value="ALL">Todos los cursos</MenuItem>
              {academyCourses.map((course) => (
                <MenuItem key={`filter-course-${course.id}`} value={course.id}>{course.title}</MenuItem>
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
                      <Typography sx={{ fontWeight: 800, color: '#173A68' }}>{workshop.courseTitle}</Typography>
                      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mt: 0.5 }}>
                        <Chip size="small" label={`Plataforma: ${workshop.platform}`} />
                        <Chip size="small" label={workshopState.label} sx={{ bgcolor: workshopState.background, color: workshopState.color, fontWeight: 700 }} />
                        <Chip size="small" label={`Programado: ${formatWorkshopDateTime(workshop.scheduledAt)}`} />
                      </Box>
                      <Typography sx={{ color: '#304965', fontSize: '0.9rem', mt: 0.4 }}>{workshop.url}</Typography>
                      {workshop.notes && <Typography sx={{ color: '#5C6F86', fontSize: '0.85rem', mt: 0.4 }}>Notas: {workshop.notes}</Typography>}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                      <Button variant="contained" onClick={() => openWorkshopRoom(workshop.url)} sx={{ textTransform: 'none', bgcolor: '#173A68', '&:hover': { bgcolor: '#112D51' } }}>
                        Entrar a sala
                      </Button>
                      <Button variant="outlined" onClick={() => void copyWorkshopRoomLink(workshop.url)} sx={{ textTransform: 'none' }}>
                        Copiar enlace
                      </Button>
                      <Button variant="outlined" onClick={() => shareWorkshopByWhatsApp(workshop.courseTitle, workshop.url)} sx={{ textTransform: 'none' }}>
                        Compartir WhatsApp
                      </Button>
                      <Button variant="outlined" onClick={() => shareWorkshopByEmail(workshop.courseTitle, workshop.url)} sx={{ textTransform: 'none' }}>
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
    </Box>
  );

  return tab === 'Cursos' ? renderCourses() : renderWorkshops();
};
