import React, { useState } from 'react';
import type { FC } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
} from '@mui/material';
import { Google, LinkedIn, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../../services/auth.service';
import { UserRole, type AuthUser, type LoginDto, type RegisterDto } from '../../types/auth.types';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AuthPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  tab?: number;
  handleAdminLogin?: (email: string, password: string) => boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  general?: string;
}

const REGISTER_PASSWORD_RULES = [
  'Entre 8 y 64 caracteres.',
  'Al menos 1 letra mayúscula (A-Z).',
  'Al menos 1 letra minúscula (a-z).',
  'Al menos 1 número (0-9).',
  'Al menos 1 símbolo especial (por ejemplo: !@#$%^&*).',
  'Sin espacios en blanco.',
];

const validateEmail = (email: string): string | undefined => {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return 'El correo electrónico es obligatorio.';
  }

  if (!trimmedEmail.includes('@')) {
    return 'El correo debe incluir el símbolo @.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return 'Ingresa un correo electrónico válido.';
  }

  return undefined;
};

const validateRegisterPassword = (password: string): string | undefined => {
  if (password.length < 8 || password.length > 64) {
    return 'La contraseña debe tener entre 8 y 64 caracteres.';
  }

  if (/\s/.test(password)) {
    return 'La contraseña no puede contener espacios.';
  }

  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra mayúscula.';
  }

  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra minúscula.';
  }

  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos un número.';
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos un símbolo especial.';
  }

  return undefined;
};

export const AuthPage: FC<AuthPageProps> = ({ onLoginSuccess, tab: externalTab, handleAdminLogin }) => {
  const navigate = useNavigate();
  const [internalTab, setInternalTab] = useState<number>(externalTab ?? 0); // 0 = Iniciar sesión, 1 = Registrarse
  const [role, setRole] = useState<'talento' | 'empresa'>('talento');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const tab = externalTab ?? internalTab;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (externalTab !== undefined) {
      navigate(newValue === 0 ? '/login' : '/register');
      return;
    }

    setInternalTab(newValue);
  };

  const handleRoleChange = (newRole: 'talento' | 'empresa') => {
    setRole(newRole);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'email') {
      const emailError = validateEmail(value);
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }

    if (name === 'password' && tab === 1) {
      const passwordError = validateRegisterPassword(value);
      setErrors((prev) => ({ ...prev, password: passwordError }));
    }
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (tab === 1 && formData.name.trim().length < 3) {
      nextErrors.name = 'Ingresa un nombre o razón social válido (mínimo 3 caracteres).';
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      nextErrors.email = emailError;
    }

    if (tab === 1) {
      const passwordError = validateRegisterPassword(formData.password);
      if (passwordError) {
        nextErrors.password = passwordError;
      }
    } else if (!formData.password) {
      nextErrors.password = 'Ingresa tu contraseña.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (tab === 1) {
        const payload: RegisterDto = {
          email: formData.email.trim(),
          password: formData.password,
          role: role === 'talento' ? UserRole.TALENT : UserRole.COMPANY,
        };
        await registerUser(payload);
        navigate('/login');
      } else {
        // Lógica especial para Admin01
        if (handleAdminLogin && handleAdminLogin(formData.email.trim(), formData.password)) {
          // El login de admin fue exitoso, el resto ya lo maneja handleAdminLogin
          return;
        }
        const payload: LoginDto = {
          email: formData.email.trim(),
          password: formData.password,
        };
        const response = await loginUser(payload);
        const token = response.accessToken;
        if (token && response.user) {
          localStorage.setItem('token', token);
          const authUser: AuthUser = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name ?? response.user.email,
            role: response.user.role,
          };
          localStorage.setItem('authUser', JSON.stringify(authUser));
          onLoginSuccess(authUser);
          navigate('/dashboard');
        } else {
          setErrors({ general: 'No fue posible iniciar sesión. Verifica tus credenciales.' });
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setErrors({ general: err.message });
      } else {
        setErrors({ general: 'Ocurrió un error inesperado. Intenta nuevamente.' });
      }
    } finally {
      setIsSubmitting(false);
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

        {errors.general && <Typography color="error" align="center" sx={{ mb: 2 }}>{errors.general}</Typography>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tab === 1 && (
            <TextField 
              label="Nombre y Apellido / Razón Social" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              fullWidth 
              error={Boolean(errors.name)}
              helperText={errors.name}
              autoComplete="name"
            />
          )}
          <TextField 
            label="Correo Electrónico" 
            name="email" 
            type="email" 
            value={formData.email} 
            onChange={handleChange} 
            onBlur={handleBlur}
            required 
            fullWidth 
            error={Boolean(errors.email)}
            helperText={errors.email}
            autoComplete="email"
          />
          <FormControl fullWidth required error={Boolean(errors.password)} variant="outlined">
            <InputLabel htmlFor="password-input">Contraseña</InputLabel>
            <OutlinedInput
              id="password-input"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete={tab === 0 ? 'current-password' : 'new-password'}
              label="Contraseña"
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    tabIndex={-1}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              sx={{
                backgroundColor: '#fff',
                '& input:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 100px #fff inset',
                  WebkitTextFillColor: '#000',
                },
              }}
            />
            <FormHelperText>
              {errors.password || (tab === 1 ? 'Usa una contraseña segura para proteger tu cuenta.' : ' ')}
            </FormHelperText>
          </FormControl>
          {tab === 1 && (
            <Typography variant="caption" sx={{ color: '#4A5568' }}>
              Formato sugerido: {REGISTER_PASSWORD_RULES.join(' ')}
            </Typography>
          )}
          <Button 
            type="submit" 
            variant="contained" 
            size="large" 
            disabled={isSubmitting}
            sx={{ bgcolor: '#DD6B20', color: '#fff', '&:hover': { bgcolor: '#C05621' }, mt: 1 }}
          >
            {isSubmitting ? 'Procesando...' : tab === 0 ? 'Ingresar' : 'Registrar'}
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
            onClick={() => window.location.href = `${apiBaseUrl}/auth/google`}
          >
            Google
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<LinkedIn />} 
            fullWidth 
            sx={{ borderColor: '#0A66C2', color: '#0A66C2' }}
            onClick={() => window.location.href = `${apiBaseUrl}/auth/linkedin`}
          >
            LinkedIn
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};