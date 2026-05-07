import React from 'react';
import{AppBar, Toolbar, Typography, Button, Box} from '@mui/material';

export const Navbar = ({onLoginClick, onRegisterClick, onHomeClick}) => {
    return(
        <AppBar position='sticky' sx={{bgcolor: '#1A365D', boxShadow: 'none'}}>
            <Toolbar sx={{display: 'flex', justifyContent: 'space-between'}}>
                <Typography variant='h6' component='div' sx={{fontWeight: 'bold', color: '#fff'}} onClick={onHomeClick}>
                    Red de Bienestar Laboral
                </Typography>
                <Box sx={{display:'flex', gap:2}}>
                    <Button color='inherit' sx={{color: '#fff'}} href='#home'>Inicio</Button>
                    <Button color='inherit' sx={{color: '#fff'}} href='#valueProposition'>Propuesta de Valor</Button>
                    <Button color='inherit' sx={{color: '#fff'}} href='#marketplace'>Marketplace</Button>
                    <Button color='inherit' sx={{color: '#fff'}} href='#history'>Historia de Exito</Button>
                    <Button color='inherit' sx={{color: '#fff'}} href='#courses'>Cursos</Button>
                    <Button variant='contained' sx={{bgcolor: '#DD6B20', '&:hover':{bgcolor: '#C05621'}}} onClick={onLoginClick}>Iniciar Sesión</Button>
                    <Button variant='contained' sx={{bgcolor: '#DD6B20', '&:hover':{bgcolor: '#C05621'}}} onClick={onRegisterClick}>Registrarse</Button>
                </Box>
            </Toolbar>
        </AppBar>
    )
}