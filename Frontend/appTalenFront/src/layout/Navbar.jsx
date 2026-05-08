import { Link } from 'react-router-dom';
import { NavHashLink } from 'react-router-hash-link';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

export const Navbar = () => {
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
          {/* NavHashLink permite volver a la landing y bajar al ID específico automáticamente */}
          <Button color='inherit' component={NavHashLink} smooth to="/#home">Inicio</Button>
          <Button color='inherit' component={NavHashLink} smooth to="/#valueProposition">Propuesta de Valor</Button>
          <Button color='inherit' component={NavHashLink} smooth to="/#marketplace">Marketplace</Button>
          
          {/* Botones de Ruta Fija */}
          <Button 
            variant='contained' 
            component={Link} 
            to="/login"
            sx={{ bgcolor: '#DD6B20', '&:hover':{ bgcolor: '#C05621' } }}
          >
            Iniciar Sesión
          </Button>
          
          <Button 
            variant='contained' 
            component={Link} 
            to="/register"
            sx={{ bgcolor: '#DD6B20', '&:hover':{ bgcolor: '#C05621' } }}
          >
            Registrarse
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};