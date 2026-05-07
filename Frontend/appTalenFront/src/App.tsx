export interface AuthUser {
  id: string;
  name: string;
  email: string;
  [key: string]: unknown;
}
import { useState } from 'react';
import { LandingPage } from './feactures/landing/LandingPage';
import { AuthPage } from './feactures/auth/AuthPage.tsx';
import { Navbar } from './layout/Navbar';
import { Footer } from './layout/Footer';
import { Box, CssBaseline } from '@mui/material';

export default function App() {
  const [view, setView] = useState('landing'); // Controla la vista 'landing' o 'auth'

  const handleGetStarted = () => {
    setView('auth');
  };

  const handleLoginClick = () => {
    setView('auth');
  };

  const handleLoginSuccess = (user: AuthUser) => {
    console.log('Autenticación exitosa:', user);
    // Aquí redirigiremos al dashboard según el perfil del usuario logueado
  };

  const handleRegisterClick = () => {
    setView('register');
  };

  const handleHomeClick = () => {
    setView('landing');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#F7FAFC' }}>
      <CssBaseline />
      <Navbar onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} onHomeClick={handleHomeClick} />

      <Box sx={{ flex: 1 }}>
        {view === 'landing' && (
          <LandingPage onGetStarted={handleGetStarted} />
        )}

        {view === 'auth' && (
          <AuthPage onLoginSuccess={handleLoginSuccess} tab={0} />
        )}

        {view === 'register' && (
          <AuthPage onLoginSuccess={handleLoginSuccess} tab={1} />
        )}
      </Box>

      <Footer />
    </Box>
  );
}
