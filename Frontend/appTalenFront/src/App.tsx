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

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  [key: string]: unknown;
}

function AppContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('authUser');

    if (!token || !storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      localStorage.removeItem('authUser');
      localStorage.removeItem('token');
      return null;
    }
  });

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLoginSuccess = (userData: AuthUser) => {
    console.log('Autenticación exitosa:', userData);
    setUser(userData);
    navigate('/dashboard');
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
            element={user ? <Navigate to="/dashboard" /> : <AuthPage onLoginSuccess={handleLoginSuccess} tab={0} />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" /> : <AuthPage onLoginSuccess={handleLoginSuccess} tab={1} />} 
          />

          {/* Ejemplo de ruta protegida o futura */}
          <Route path="/dashboard" element={user ? <div>Dashboard Content</div> : <Navigate to="/login" />} />
          
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