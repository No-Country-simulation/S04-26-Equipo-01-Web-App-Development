import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Navbar } from './layout/Navbar';
import { Footer } from './layout/Footer';
import { LandingPage } from './features/landing/LandingPage';
import { AuthPage } from './features/auth/AuthPage.tsx';
import { TalentDashboard } from './features/profile/TalentDashboard.tsx';
import { CompanyDashboard } from './features/marketplace/CompanyDashboard.tsx';
import { AdminDashboard } from './features/admin/AdminDashboard.tsx';
import { AcademyPro } from './features/academy/AcademyPro.tsx';
import { getStoredAuthUser, loginAdmin } from './utils/admin-auth';
import type { AuthUser } from './types/auth.types';

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

          {/* Ruta Atrapadora para OAuth */}
          <Route 
            path="/login-success" 
            element={<LoginSuccess onLoginSuccess={handleLoginSuccess} />} 
          />

          <Route
            path="/dashboard"
            element={
              user ? (
                user.role === 'TALENT' ? <TalentDashboard user={user} /> :
                user.role === 'COMPANY' ? <CompanyDashboard user={user} /> :
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