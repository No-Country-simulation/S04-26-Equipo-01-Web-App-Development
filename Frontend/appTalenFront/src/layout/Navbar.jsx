import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { AppBar, Toolbar, Typography, Button, Box, Drawer, IconButton, Stack } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

export const Navbar = ({ isAuthenticated = false, onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  const commonNavLinks = (
    <>
      <Button color='inherit' component={HashLink} smooth to="/#home" onClick={closeMobileMenu}>Inicio</Button>
      <Button color='inherit' component={HashLink} smooth to="/#valueProposition" onClick={closeMobileMenu}>Propuesta de Valor</Button>
      <Button color='inherit' component={HashLink} smooth to="/#marketplace" onClick={closeMobileMenu}>Marketplace</Button>
    </>
  );

  return (
    <AppBar position='sticky' sx={{ bgcolor: '#1A365D', boxShadow: 'none' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
        
        {/* Link a la raíz */}
        <Typography 
          variant='h6'
          component={HashLink}
          smooth
          to="/#home"
          sx={{
            fontWeight: 'bold',
            color: '#fff',
            textDecoration: 'none',
            fontSize: { xs: '1.02rem', sm: '1.25rem' },
            lineHeight: 1.2,
            maxWidth: { xs: 200, sm: 'unset' },
            display: 'block',
          }}
        >
          Red de Bienestar Laboral
        </Typography>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
          {commonNavLinks}

          {!isAuthenticated ? (
            <>
              <Button
                variant='contained'
                component={Link}
                to="/login"
                sx={{ bgcolor: '#DD6B20', '&:hover': { bgcolor: '#C05621' } }}
              >
                Iniciar Sesion
              </Button>

              <Button
                variant='contained'
                component={Link}
                to="/register"
                sx={{ bgcolor: '#DD6B20', '&:hover': { bgcolor: '#C05621' } }}
              >
                Registrarse
              </Button>
            </>
          ) : (
            <>
              <Button
                variant='contained'
                component={Link}
                to="/dashboard"
                sx={{ bgcolor: '#DD6B20', '&:hover': { bgcolor: '#C05621' } }}
              >
                Dashboard
              </Button>
              <Button
                variant='outlined'
                color='inherit'
                onClick={onLogout}
              >
                Cerrar sesion
              </Button>
            </>
          )}
        </Box>

        <IconButton
          color='inherit'
          aria-label='Abrir menu de navegacion'
          edge='end'
          sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          onClick={() => setMobileOpen(true)}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      <Drawer
        anchor='right'
        open={mobileOpen}
        onClose={closeMobileMenu}
        PaperProps={{
          sx: {
            width: 300,
            bgcolor: '#173A68',
            color: '#fff',
            px: 2,
            py: 2,
          },
        }}
      >
        <Stack spacing={1.2} sx={{ mt: 1 }}>
          {commonNavLinks}

          {!isAuthenticated ? (
            <>
              <Button
                variant='contained'
                component={Link}
                to="/login"
                onClick={closeMobileMenu}
                sx={{ bgcolor: '#DD6B20', '&:hover': { bgcolor: '#C05621' } }}
              >
                Iniciar Sesion
              </Button>

              <Button
                variant='contained'
                component={Link}
                to="/register"
                onClick={closeMobileMenu}
                sx={{ bgcolor: '#DD6B20', '&:hover': { bgcolor: '#C05621' } }}
              >
                Registrarse
              </Button>
            </>
          ) : (
            <>
              <Button
                variant='contained'
                component={Link}
                to="/dashboard"
                onClick={closeMobileMenu}
                sx={{ bgcolor: '#DD6B20', '&:hover': { bgcolor: '#C05621' } }}
              >
                Dashboard
              </Button>
              <Button variant='outlined' color='inherit' onClick={() => { closeMobileMenu(); onLogout?.(); }}>
                Cerrar sesion
              </Button>
            </>
          )}
        </Stack>
      </Drawer>
    </AppBar>
  );
};