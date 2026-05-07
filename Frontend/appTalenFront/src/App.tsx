import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Navbar } from './layout/Navbar';
import { Footer } from './layout/Footer';
import { LandingPage } from './feactures/landing/LandingPage';
import { AuthPage } from './feactures/auth/AuthPage.tsx';
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  [key: string]: unknown;
}

function AppContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLoginSuccess = (userData: AuthUser) => {
    console.log('Autenticación exitosa:', userData);
    setUser(userData);
    navigate('/dashboard');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#F7FAFC' }}>
      <CssBaseline />
      
      {/* El Navbar ya no necesita funciones de estado, el Router maneja todo */}
      <Navbar />

      <Box sx={{ flex: 1 }}>
        <Routes>
          {/* Ruta Principal */}
          <Route path="/" element={<LandingPage onGetStarted={handleGetStarted} />} />

          {/* Rutas de Autenticación pasando el tab correspondiente */}
          <Route 
            path="/login" 
            element={<AuthPage onLoginSuccess={handleLoginSuccess} tab={0} />} 
          />
          <Route 
            path="/register" 
            element={<AuthPage onLoginSuccess={handleLoginSuccess} tab={1} />} 
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