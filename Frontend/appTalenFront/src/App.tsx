import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
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

function AppContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuthUser());

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLoginSuccess = (userData: AuthUser) => {
    setUser(userData);
    navigate('/dashboard');
  };

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