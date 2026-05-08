import React from 'react';
import{Box, Container, Typography, Link} from '@mui/material';

export const Footer = () => {
   return(
        <Box component='footer' sx={{ bgcolor: '#1A365D', color:'#fff', mt: 'auto', width: '100%' }}>
            <Container maxWidth={false} disableGutters sx={{ py: 4, px: { xs: 2, md: 3 } }}>
                <Typography variant='body2' color='inherit' sx={{ textAlign: 'center', mb: 2 }}>
                    &copy; {new Date().getFullYear()} Red de Bienestar Laboral. Todos los derechos reservados.
                </Typography>
                <Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.25)', pt: 2 }}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                            gap: 1,
                            textAlign: 'center',
                        }}
                    >
                        <Link href='#' color='inherit' underline='hover'>Terminos y Condiciones</Link>
                        <Link href='#' color='inherit' underline='hover'>Politicas de Privacidad</Link>
                        <Link href='#' color='inherit' underline='hover'>Contacto</Link>
                    </Box>
                </Box>
            </Container>
        </Box>
   )
}