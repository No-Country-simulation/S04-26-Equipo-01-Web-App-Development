import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  LinearProgress, 
  Button, 
  Card, 
  CardContent,
  Avatar
} from '@mui/material';
import { ErrorOutlined } from '@mui/icons-material';
import type { AuthUser } from '../../types/auth.types';

interface TalentDashboardProps {
  user: AuthUser;
}

export const TalentDashboard = ({ user }: TalentDashboardProps) => {
  // Estos valores vendran del backend mas adelante
  const profileCompletion = 75;
  const evaluationsCount = "2/3";
  const coursesInProgress = 4;
  const validatedSkills = "+12";

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
      title: 'FORMACION',
      items: ['Mi Ruta de Cursos', 'Pendientes', 'En Ejecucion', 'Resultados (Diplomas)'],
    },
  ];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'EVALUACION PERFIL': true,
    SKILLS: true,
    'MI CV PROFESIONAL': true,
    FORMACION: true,
  });
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);

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
                    onClick={() => setSelectedMenuItem(item)}
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
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Typography sx={{ fontWeight: 700, color: '#1F3557' }}>Hola, {user?.name || 'Talent'}</Typography>
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#E6EDF6', color: '#213D63', fontWeight: 700 }}>
            {(user?.name || 'T').charAt(0).toUpperCase()}
          </Avatar>
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
                  Bienvenido a tu Red de Bienestar
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, color: '#202D3D' }}>
                  Tu perfil esta al <strong>{profileCompletion}%</strong> de completitud. Sincroniza tus cursos para destacar ante las empresas.
                </Typography>
              </Paper>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mb: 4, alignItems: 'stretch' }}>
                <Box sx={{ flex: '1 1 220px', display: 'flex' }}>
                  <Card sx={{ borderRadius: 2.5, textAlign: 'center', p: 0.5, minHeight: 150, width: '100%', display: 'flex' }}>
                    <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Evaluaciones</Typography>
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: '#1F3E69' }}>{evaluationsCount}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={66}
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
                      <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#0E1726' }}>
                        Completa tu Evaluacion Tecnica de Liderazgo
                      </Typography>
                      <Typography sx={{ color: '#6F8098', mt: 0.5 }}>
                        Esto te permitira desbloquear el acceso al Marketplace de empresas Senior.
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
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
                    INICIAR TEST
                  </Button>
                </Box>
              </Paper>
            </>
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