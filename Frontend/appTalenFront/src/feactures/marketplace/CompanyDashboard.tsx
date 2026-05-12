import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Card, 
  CardContent,
  Avatar
} from '@mui/material';
import type { AuthUser } from '../../types/auth.types';

interface CompanyDashboardProps {
  user: AuthUser;
}

export const CompanyDashboard = ({ user }: CompanyDashboardProps) => {
  const sidebarSections = [
    {
      title: 'TALENTO',
      items: ['Perfil Candidato', 'Skills Validadas', 'CV / Living Profile', 'Cursos Realizados'],
    },
    {
      title: 'VACANTES / SOLICITUD',
      items: ['Mis Solicitudes', 'Candidatos Preseleccionados', 'Seleccionados', 'Finalistas'],
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
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: '#1F3E69' }}>8</Typography>
                      <Typography sx={{ mt: 1, fontWeight: 800, color: '#E5741F' }}>EN PROGRESO</Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box sx={{ flex: '1 1 220px', display: 'flex' }}>
                  <Card sx={{ borderRadius: 2.5, textAlign: 'center', p: 0.5, minHeight: 150, width: '100%', display: 'flex' }}>
                    <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Candidatos Totales</Typography>
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: '#1F3E69' }}>156</Typography>
                      <Typography sx={{ mt: 1, fontWeight: 800, color: '#2EA35A' }}>DISPONIBLES</Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box sx={{ flex: '1 1 220px', display: 'flex' }}>
                  <Card sx={{ borderRadius: 2.5, textAlign: 'center', p: 0.5, minHeight: 150, width: '100%', display: 'flex' }}>
                    <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Procesos Finalizados</Typography>
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: '#1F3E69' }}>12</Typography>
                      <Typography sx={{ mt: 1, fontWeight: 800, color: '#1F3E69' }}>ESTE MES</Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: '0px 3px 10px rgba(11,38,69,0.08)' }}>
                <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#0E1726' }}>Acciones Rapidas</Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                    Nueva Vacante
                  </Button>
                  <Button
                    variant="outlined"
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
