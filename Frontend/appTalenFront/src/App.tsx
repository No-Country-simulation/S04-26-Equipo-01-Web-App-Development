import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, CssBaseline, Typography } from '@mui/material';
import { Navbar } from './layout/Navbar';
import { Footer } from './layout/Footer';
import { LandingPage } from './feactures/landing/LandingPage';
import { AuthPage } from './feactures/auth/AuthPage.tsx';
import { TalentDashboard } from './feactures/profile/TalentDashboard';
import { CompanyDashboard } from './feactures/marketplace/CompanyDashboard';
import { AdminDashboard } from './feactures/admin/AdminDashboard';
import { AcademyPro } from './feactures/academy/AcademyPro.tsx';
import { getStoredAuthUser, loginAdmin } from './utils/admin-auth';
import type { AuthUser } from './types/auth.types';

type SocialAuthCallbackProps = {
  onSocialLogin: (userData: AuthUser) => void;
};

function SocialAuthCallback({ onSocialLogin }: SocialAuthCallbackProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) {
      return;
    }
    hasProcessedRef.current = true;

    const params = new URLSearchParams(location.search);
    const oauthError =
      params.get('oauthError') ||
      params.get('error_description') ||
      params.get('error');

    if (oauthError) {
      navigate(
        `/login?oauthError=${encodeURIComponent(
          'No se pudo completar la autenticacion social. ' + oauthError,
        )}`,
        { replace: true },
      );
      return;
    }

    const token = params.get('token');
    const userId = params.get('userId');
    const email = params.get('email');
    const role = params.get('role');

    if (!token || !userId || !email || !role) {
      navigate(
        '/login?oauthError=No%20se%20pudo%20completar%20la%20autenticacion%20social.',
        { replace: true },
      );
      return;
    }

    const authUser: AuthUser = {
      id: userId,
      email,
      name: email,
      role: role as AuthUser['role'],
    };

    localStorage.setItem('token', token);
    localStorage.setItem('authUser', JSON.stringify(authUser));
    onSocialLogin(authUser);
    navigate('/dashboard', { replace: true });
  }, [location.search, navigate, onSocialLogin]);

  return (
    <Box
      sx={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <CircularProgress />
      <Typography sx={{ color: '#1F3557', fontWeight: 600 }}>
        Completando autenticacion social...
      </Typography>
    </Box>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuthUser());

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLoginSuccess = useCallback((userData: AuthUser) => {
    setUser(userData);
    navigate('/dashboard');
  }, [navigate]);

  const handleAdminLogin = (email: string, password: string) => {
    const adminUser = loginAdmin(email, password);

    if (!adminUser) {
      return false;
    }

    setUser(adminUser);
    navigate('/dashboard');
    return true;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authUser');
    setUser(null);
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#F7FAFC' }}>
      <CssBaseline />
      
      {/* El Navbar ya no necesita funciones de estado, el Router maneja todo */}
      <Navbar isAuthenticated={Boolean(user)} onLogout={handleLogout} />

      <Box sx={{ flex: 1 }}>
        <Routes>
          {/* Ruta Principal */}
          <Route path="/" element={<LandingPage onGetStarted={handleGetStarted} />} />

          {/* Rutas de Autenticación pasando el tab correspondiente */}
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/dashboard" /> : <AuthPage onLoginSuccess={handleLoginSuccess} tab={0} handleAdminLogin={handleAdminLogin} />
            }
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" /> : <AuthPage onLoginSuccess={handleLoginSuccess} tab={1} />} 
          />

          <Route
            path="/auth/callback"
            element={<SocialAuthCallback onSocialLogin={handleLoginSuccess} />}
          />

          <Route
            path="/dashboard"
            element={
              user ? (
                user.role === 'TALENT' ? <TalentDashboard user={user} /> :
                user.role === 'COMPANY' || user.role === 'RECRUITER' ? <CompanyDashboard user={user} /> :
                user.role === 'ADMIN' ? <AdminDashboard user={user} /> :
                <Navigate to="/" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route path="/academia" element={user ? <AcademyPro /> : <Navigate to="/login" />} />
          {/* TEST Route - Remove in production */}
          <Route 
            path="/test/talent-dashboard" 
            element={
              <TalentDashboard user={{ id: 'test', name: 'Test User', email: 'test@example.com', role: 'TALENT' }} />
            } 
          />          
          {/* Redirección por si escriben cualquier otra cosa */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>

      <Footer />
    </Box>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}