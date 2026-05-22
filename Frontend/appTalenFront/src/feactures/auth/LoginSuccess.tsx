import { useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Box, CircularProgress, Typography } from '@mui/material';
import { UserRole, type AuthUser } from '../../types/auth.types'; 

interface LoginSuccessProps {
  onLoginSuccess: (user: AuthUser) => void;
}

interface CustomJwtPayload {
  id?: string;
  sub?: string;
  email: string;
  name?: string;
  firstName?: string;
  role: string;
}

export const LoginSuccess: FC<LoginSuccessProps> = ({ onLoginSuccess }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      try {
        localStorage.setItem('token', token);
        
        const decodedToken = jwtDecode<CustomJwtPayload>(token);

        const authUser: AuthUser = {
          id: decodedToken.id || decodedToken.sub || '',
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.firstName || decodedToken.email,
          role: decodedToken.role as UserRole, 
        };

        localStorage.setItem('authUser', JSON.stringify(authUser));
        onLoginSuccess(authUser);

      } catch (error) {
        console.error('Error al decodificar el token OAuth:', error);
        navigate('/login', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
    
  }, [navigate, onLoginSuccess, searchParams]); 

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <CircularProgress size={60} sx={{ color: '#1A365D', mb: 3 }} />
      <Typography variant="h6" sx={{ color: '#4A5568', mt: 2 }}>
        Completando inicio de sesión seguro...
      </Typography>
    </Box>
  );
};