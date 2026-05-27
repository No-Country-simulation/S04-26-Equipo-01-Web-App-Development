import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { AuthUser } from '../../types/auth.types';
import { AdminAcademyPanel } from './AdminAcademyPanel';

interface AdminDashboardProps {
  user: AuthUser;
}

type AdminView = 'home' | 'config';

export const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [currentView, setCurrentView] = useState<AdminView>('home');
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);

  const sidebarSections = [
    {
      title: 'GESTION USUARIOS',
      items: ['Directorio Talento (+45)', 'Directorio Empresas', 'Validacion de Cuentas', 'Permisos y Roles'],
    },
    {
      title: 'PROCESOS & MATCH',
      items: ['Supervision de Vacantes', 'Auditoria de Mash-ups', 'Reporte de Colocaciones'],
    },
    {
      title: 'CURATORIA ACADEMIA',
      items: ['Aprobar Cursos Empresa', 'Gestion de Badges/Insignias', 'Moderacion de Foros'],
    },
    {
      title: 'ACADEMIA PRO',
      items: ['Cursos', 'Talleres'],
    },
  ];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'GESTION USUARIOS': true,
    'PROCESOS & MATCH': true,
    'CURATORIA ACADEMIA': true,
    'ACADEMIA PRO': true,
  });

  const handleToggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const openHomePlaceholder = (item: string) => {
    setSelectedMenuItem(item);
    setCurrentView('home');
  };

  const renderHomeContent = () => {
    if (selectedMenuItem === 'Cursos' || selectedMenuItem === 'Talleres') {
      return <AdminAcademyPanel tab={selectedMenuItem} />;
    }

    if (selectedMenuItem) {
      return (
        <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, minHeight: 420, boxShadow: '0px 3px 10px rgba(11,38,69,0.08)' }}>
          <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 800, color: '#1F3E69' }}>
            Seccion seleccionada: {selectedMenuItem}
          </Typography>
          <Typography sx={{ mt: 1.5, color: '#5C6F86', maxWidth: 760 }}>
            Esta pantalla es temporal para que el equipo de diseno agregue el layout final.
            Conservamos la navegacion y estructura para integrar backend mas adelante.
          </Typography>
        </Paper>
      );
    }

    return (
      <>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mb: 2.5, alignItems: 'stretch' }}>
          <Box sx={{ flex: '1 1 220px', display: 'flex' }}>
            <Card sx={{ width: '100%', borderRadius: 2.5, borderTop: '4px solid #173A68' }}>
              <CardContent>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#66788F' }}>TOTAL TALENTO</Typography>
                <Typography sx={{ fontSize: '3rem', fontWeight: 800, color: '#111C33', lineHeight: 1.2 }}>652</Typography>
                <Typography sx={{ fontSize: '0.95rem', color: '#2FB987', fontWeight: 700 }}>+12 esta semana</Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 220px', display: 'flex' }}>
            <Card sx={{ width: '100%', borderRadius: 2.5, borderTop: '4px solid #173A68' }}>
              <CardContent>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#66788F' }}>EMPRESAS ACTIVAS</Typography>
                <Typography sx={{ fontSize: '3rem', fontWeight: 800, color: '#111C33', lineHeight: 1.2 }}>42</Typography>
                <Typography sx={{ fontSize: '0.95rem', color: '#111C33' }}>15 en espera de validacion</Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 220px', display: 'flex' }}>
            <Card sx={{ width: '100%', borderRadius: 2.5, borderTop: '4px solid #173A68' }}>
              <CardContent>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#66788F' }}>MATCH RATE PROMEDIO</Typography>
                <Typography sx={{ fontSize: '3rem', fontWeight: 800, color: '#111C33', lineHeight: 1.2 }}>78%</Typography>
                <Typography sx={{ fontSize: '0.95rem', color: '#E5741F', fontWeight: 700 }}>Meta: 85%</Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 220px', display: 'flex' }}>
            <Card sx={{ width: '100%', borderRadius: 2.5, borderTop: '4px solid #E5741F' }}>
              <CardContent>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#66788F' }}>CURSOS EN REVISION</Typography>
                <Typography sx={{ fontSize: '3rem', fontWeight: 800, color: '#111C33', lineHeight: 1.2 }}>08</Typography>
                <Typography sx={{ fontSize: '0.95rem', color: '#111C33' }}>Aprobar contenido empresa</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: '0px 3px 10px rgba(11,38,69,0.08)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontSize: { xs: '1.7rem', md: '2rem' }, fontWeight: 800, color: '#0E1726' }}>
              Control de Usuarios Recientes
            </Typography>
            <Button
              variant="contained"
              sx={{ bgcolor: '#173A68', borderRadius: 1.5, px: 3, py: 1, fontWeight: 700, '&:hover': { bgcolor: '#112D51' } }}
            >
              + NUEVO USUARIO
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Nombre / Razon Social</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo Perfil</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Registro</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Mariana Rodriguez</TableCell>
                  <TableCell><Chip label="TALENTO" sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 700 }} /></TableCell>
                  <TableCell>10 May 2026</TableCell>
                  <TableCell sx={{ color: '#2FB987', fontWeight: 700 }}>Activo</TableCell>
                  <TableCell><Button variant="outlined" size="small">Gestionar</Button></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Tech Solutions S.A.</TableCell>
                  <TableCell><Chip label="EMPRESA" sx={{ bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 700 }} /></TableCell>
                  <TableCell>09 May 2026</TableCell>
                  <TableCell sx={{ color: '#E5741F', fontWeight: 700 }}>Pendiente</TableCell>
                  <TableCell><Button variant="outlined" size="small">Validar</Button></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Alberto Morales</TableCell>
                  <TableCell><Chip label="TALENTO" sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 700 }} /></TableCell>
                  <TableCell>08 May 2026</TableCell>
                  <TableCell sx={{ color: '#2FB987', fontWeight: 700 }}>Activo</TableCell>
                  <TableCell><Button variant="outlined" size="small">Gestionar</Button></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Multinacional X</TableCell>
                  <TableCell><Chip label="EMPRESA" sx={{ bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 700 }} /></TableCell>
                  <TableCell>05 May 2026</TableCell>
                  <TableCell sx={{ color: '#2FB987', fontWeight: 700 }}>Activo</TableCell>
                  <TableCell><Button variant="outlined" size="small">Gestionar</Button></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </>
    );
  };

  const renderConfigContent = () => {
    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Box>
            <Typography sx={{ fontSize: { xs: '2rem', md: '2.3rem' }, fontWeight: 800, color: '#111C33' }}>
              Configuracion de Sistema
            </Typography>
            <Typography sx={{ mt: 0.5, color: '#5F738B' }}>Control de reglas de negocio para la red.</Typography>
          </Box>
          <Button
            variant="contained"
            sx={{ bgcolor: '#173A68', borderRadius: 1.5, px: 4, py: 1.3, fontWeight: 800, '&:hover': { bgcolor: '#112D51' } }}
          >
            GUARDAR CAMBIOS
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'stretch' }}>
          <Box sx={{ flex: '1 1 480px', display: 'flex' }}>
            <Paper sx={{ width: '100%', p: 3, borderRadius: 3 }}>
              <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: '#1F3E69', mb: 1.5 }}>Algoritmo de Match</Typography>
              <Typography sx={{ fontWeight: 700 }}>Prioridad: Habilidades Blandas</Typography>
              <Typography sx={{ color: '#61768E', mb: 1.5 }}>Peso de las soft-skills en el porcentaje total</Typography>
              <Divider sx={{ mb: 1.5 }} />
              <Typography sx={{ fontWeight: 700 }}>Filtro por Anos de Experiencia</Typography>
              <Typography sx={{ color: '#61768E', mb: 1.5 }}>Ignorar discrepancia menor a 3 anos</Typography>
              <Divider sx={{ mb: 1.5 }} />
              <Typography sx={{ fontWeight: 700 }}>Bonus por Formacion TalentPro</Typography>
              <Typography sx={{ color: '#61768E' }}>Aumentar match si completo cursos de la red</Typography>
            </Paper>
          </Box>

          <Box sx={{ flex: '1 1 480px', display: 'flex' }}>
            <Paper sx={{ width: '100%', p: 3, borderRadius: 3 }}>
              <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: '#1F3E69', mb: 1.5 }}>Reglas de Validacion</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Validacion Manual de Empresas</Typography>
                  <Typography sx={{ color: '#61768E' }}>Revision de admin antes de publicar vacantes</Typography>
                </Box>
                <Switch defaultChecked sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#E5741F' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#E5741F' } }} />
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Typography sx={{ fontWeight: 700 }}>Requisito "Perfil Completo"</Typography>
              <Typography sx={{ color: '#61768E' }}>Minimo de tests para entrar al Marketplace</Typography>
            </Paper>
          </Box>

          <Box sx={{ flex: '1 1 480px', display: 'flex' }}>
            <Paper sx={{ width: '100%', p: 3, borderRadius: 3 }}>
              <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: '#1F3E69', mb: 1.5 }}>Diccionario de Habilidades</Typography>
              <Typography sx={{ color: '#61768E', mb: 1.5 }}>Define las etiquetas oficiales para evitar duplicados.</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                <Chip label="Liderazgo" sx={{ bgcolor: '#173A68', color: '#fff' }} />
                <Chip label="Gestion Agil" sx={{ bgcolor: '#173A68', color: '#fff' }} />
                <Chip label="Mentoring" sx={{ bgcolor: '#173A68', color: '#fff' }} />
              </Box>
              <TextField fullWidth size="small" placeholder="+ Agregar nueva habilidad oficial..." />
            </Paper>
          </Box>

          <Box sx={{ flex: '1 1 480px', display: 'flex' }}>
            <Paper sx={{ width: '100%', p: 3, borderRadius: 3 }}>
              <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: '#1F3E69', mb: 1.5 }}>Automatizacion de Feedback</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Obligar Feedback al Rechazar</Typography>
                  <Typography sx={{ color: '#61768E' }}>Empresa debe elegir motivo del listado</Typography>
                </Box>
                <Switch defaultChecked sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#E5741F' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#E5741F' } }} />
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Typography sx={{ fontWeight: 700 }}>Tiempo Limite de Respuesta</Typography>
              <Typography sx={{ color: '#61768E' }}>Dias antes de marcar vacante como "Latente"</Typography>
            </Paper>
          </Box>
        </Box>
      </>
    );
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#E9EEF3', minHeight: '100vh' }}>
      <Box
        sx={{
          width: { xs: 0, md: 320 },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          bgcolor: '#081B43',
          color: '#D7E3F2',
          borderRight: '1px solid #1D3567',
        }}
      >
        <Box sx={{ px: 3, py: 3, borderBottom: '1px solid #1D3567' }}>
          <Typography
            component="button"
            type="button"
            onClick={() => {
              setCurrentView('home');
              setSelectedMenuItem(null);
            }}
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
          <Typography sx={{ fontSize: '0.95rem', letterSpacing: 1.2, color: '#F07A25', mt: 0.8, fontWeight: 700 }}>
            ADMIN CONTROL PANEL
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
          {sidebarSections.map((section) => (
            <Box key={section.title} sx={{ borderBottom: '1px solid #1D3567' }}>
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
                  bgcolor: '#0B234F',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#F4F7FB' }}>{section.title}</Typography>
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
                      onClick={() => openHomePlaceholder(item)}
                      sx={{
                        width: '100%',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        background: selectedMenuItem === item && currentView === 'home' ? '#173A68' : 'transparent',
                        px: 3,
                        py: 1.2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.2,
                        color: '#BFD0E8',
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

        <Box sx={{ p: 2, borderTop: '1px solid #1D3567' }}>
          <Button
            fullWidth
            onClick={() => setCurrentView('config')}
            sx={{
              justifyContent: 'flex-start',
              color: '#F4F7FB',
              fontWeight: 800,
              px: 2,
              py: 1.2,
              bgcolor: currentView === 'config' ? '#173A68' : 'transparent',
            }}
          >
            CONFIGURACION
          </Button>
        </Box>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            minHeight: 74,
            bgcolor: '#F8FBFF',
            borderBottom: '1px solid #D7E1EC',
            px: { xs: 2, md: 4 },
            py: { xs: 1.2, md: 0 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            flexWrap: { xs: 'wrap', md: 'nowrap' },
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar talento, empresa o curso..."
            sx={{ width: { xs: '100%', md: 420 }, bgcolor: '#fff' }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'flex-end', md: 'flex-start' } }}>
            <Typography sx={{ color: '#E5741F', fontWeight: 800 }}>!</Typography>
            <Typography sx={{ fontWeight: 700, color: '#111C33' }}>Admin: {user?.name || 'Admin01'}</Typography>
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#081B43', color: '#fff', fontWeight: 700 }}>
              A
            </Avatar>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, overflowX: 'auto', pb: 1.2, mb: 1.2 }}>
            {sidebarSections.flatMap((section) =>
              section.items.map((item) => (
                <Button
                  key={`mobile-admin-${item}`}
                  size="small"
                  variant={selectedMenuItem === item ? 'contained' : 'outlined'}
                  onClick={() => openHomePlaceholder(item)}
                  sx={{
                    whiteSpace: 'nowrap',
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

          {currentView === 'home' ? renderHomeContent() : renderConfigContent()}
        </Box>
      </Box>
    </Box>
  );
};
