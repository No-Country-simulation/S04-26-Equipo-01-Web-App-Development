import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Box, Container, Typography, TextField, Button, Paper, Tabs, Tab } from '@mui/material';
import { Google, LinkedIn } from '@mui/icons-material';
import axios from 'axios';
import type { AuthUser } from '../../App';

interface AuthPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  tab?: number;
}

export const AuthPage: FC<AuthPageProps> = ({ onLoginSuccess, tab: externalTab }) => {
  const [tab, setTab] = useState<number>(externalTab || 0); // 0 = Iniciar sesión, 1 = Registrarse
  const [role, setRole] = useState('talento'); // 'talento' o 'empresa'
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (externalTab !== undefined && externalTab !== tab) {
      setTimeout(() => setTab(externalTab), 0);
    }
  }, [externalTab, tab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = tab === 0 ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post(endpoint, { ...formData, role });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        onLoginSuccess(response.data.user);
      }
    } catch {
      setError('Error al procesar la solicitud. Verifica tus datos de acceso.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ color: '#1A365D', fontWeight: 'bold' }}>
          {tab === 0 ? 'Iniciar Sesión' : 'Regístrate en la Red'}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <Button 
            variant={role === 'talento' ? 'contained' : 'outlined'} 
            sx={{ mx: 1, borderColor: '#1A365D', color: role === 'talento' ? '#fff' : '#1A365D', bgcolor: role === 'talento' ? '#1A365D' : 'transparent' }}
            onClick={() => handleRoleChange('talento')}
          >
            Talento
          </Button>
          <Button 
            variant={role === 'empresa' ? 'contained' : 'outlined'} 
            sx={{ mx: 1, borderColor: '#1A365D', color: role === 'empresa' ? '#fff' : '#1A365D', bgcolor: role === 'empresa' ? '#1A365D' : 'transparent' }}
            onClick={() => handleRoleChange('empresa')}
          >
            Empresa
          </Button>
        </Box>

        <Tabs value={tab} onChange={handleTabChange} centered sx={{ mb: 4 }}>
          <Tab label="Ingresar" />
          <Tab label="Crear Cuenta" />
        </Tabs>

        {error && <Typography color="error" align="center" sx={{ mb: 2 }}>{error}</Typography>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tab === 1 && (
            <TextField 
              label="Nombre y Apellido / Razón Social" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              fullWidth 
            />
          )}
          <TextField 
            label="Correo Electrónico" 
            name="email" 
            type="email" 
            value={formData.email} 
            onChange={handleChange} 
            required 
            fullWidth 
          />
          <TextField 
            label="Contraseña" 
            name="password" 
            type="password" 
            value={formData.password} 
            onChange={handleChange} 
            required 
            fullWidth 
          />
          <Button 
            type="submit" 
            variant="contained" 
            size="large" 
            sx={{ bgcolor: '#DD6B20', color: '#fff', '&:hover': { bgcolor: '#C05621' }, mt: 1 }}
          >
            {tab === 0 ? 'Ingresar' : 'Registrar Cuenta'}
          </Button>
        </Box>

        <Box sx={{ my: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">o utiliza tus redes</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<Google />} 
            fullWidth 
            sx={{ borderColor: '#2D3748', color: '#2D3748' }}
            onClick={() => window.location.href = '/api/auth/google'}
          >
            Google
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<LinkedIn />} 
            fullWidth 
            sx={{ borderColor: '#0A66C2', color: '#0A66C2' }}
            onClick={() => window.location.href = '/api/auth/linkedin'}
          >
            LinkedIn
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};