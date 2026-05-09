import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

export const Navbar = ({ isAuthenticated = false, onLogout }) => {
  return (
    <AppBar position='sticky' sx={{ bgcolor: '#1A365D', boxShadow: 'none' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        
        {/* Link a la raíz */}
        <Typography 
          variant='h6' 
          component={Link} 
          to="/" 
          sx={{ fontWeight: 'bold', color: '#fff', textDecoration: 'none' }}
        >
          Red de Bienestar Laboral
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* HashLink vuelve a la landing y baja al ID sin propagar estado activo al DOM */}
          <Button color='inherit' component={HashLink} smooth to="/#home">Inicio</Button>
          <Button color='inherit' component={HashLink} smooth to="/#valueProposition">Propuesta de Valor</Button>
          <Button color='inherit' component={HashLink} smooth to="/#marketplace">Marketplace</Button>

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
      </Toolbar>
    </AppBar>
  );
};