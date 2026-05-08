import React from "react";
import {  Box, Container, Typography, Button, Grid, Card, CardContent,} from "@mui/material";
import { School, Work } from "@mui/icons-material";

export const LandingPage = ({ onGetStarted }) => {
  const valueCardItemSx = {
    display: "flex",
    justifyContent: "center",
  };

  const valueCardSx = {
    width: { xs: "100%", md: 980 },
    minHeight: 210,
    display: "flex",
    flexDirection: "column",
    p: 2,
    boxSizing: "border-box",
  };

  return (
    <Box id="home" sx={{ bgcolor: "#F7FAFC", minHeight: "80vh" }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: "#DD6B20",
          background: "linear-gradient(135deg, #DD6B20 0%, #C05621 100%)",
          color: "#fff",
          py: { xs: 6, md: 8 },
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ fontWeight: "bold", color: "#fff", fontSize: { xs: "2rem", md: "3rem" } }}
          >
            Reinvención Profesional
          </Typography>
          <Typography variant="h6" paragraph sx={{ color: "#fff", opacity: 0.95, mb: 4 }}>
            Conectamos tu experiencia validada con las empresas. Capacítate,
            construye tu perfil dinámico y encuentra oportunidades reales.
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: "#1A365D",
              color: "#fff",
              "&:hover": { bgcolor: "#C05621" },
              px: 4,
              py: 1.5,
              fontSize: "1rem",
            }}
            onClick={onGetStarted}
          >
            Comienza Ahora
          </Button>
        </Container>
      </Box>
      {/* Propuesta de Valor */}
      <Container maxWidth="lg" sx={{ py: 8 }} id="valueProposition">
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ color: "#1A365D", fontWeight: "bold", mb: 6 }}
        >
          Nuestra Propuesta de Valor
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={12} sx={valueCardItemSx}>
            <Card sx={valueCardSx}>
              <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
                <School sx={{ fontSize: 60, color: "#DD6B20", mb: 2 }} />
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ color: "#1A365D", fontWeight: "bold" }}
                >
                  Learning Experience
                </Typography>
                <Typography
                  variant="body2"
                  gutterBottom
                  sx={{ color: "#1A365D", fontWeight: "bold" }}
                >
                  Diagnóstico personalizado y rutas de upskilling/reskilling
                  diseñadas para las exigencias del mercado actual con
                  certificaciones e insignias.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={12} sx={valueCardItemSx}>
            <Card sx={valueCardSx}>
              <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
                <Work sx={{ fontSize: 60, color: "#DD6B20", mb: 2 }} />
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ color: "#1A365D", fontWeight: "bold" }}
                >
                  Talent Marketplace
                </Typography>
                <Typography variant="body2" color="#2D3748">
                  Conecta directamente con empresas que buscan talento senior,
                  calcula el porcentaje de compatibilidad y sigue tus
                  postulaciones.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
      {/* Sección de Empresas */}
      <Box id="marketplace" sx={{ bgcolor: '#fff', py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom sx={{ color: '#1A365D', fontWeight: 'bold', mb: 4 }}>
            Empresas Aliadas
          </Typography>
          <Typography variant="body1" color="#2D3748" paragraph sx={{ maxWidth: '600px', mx: 'auto' }}>
            Trabajamos con organizaciones e instituciones para revalorizar la experiencia profesional y promover la inclusión laboral senior.
          </Typography>
        </Container>
      </Box>

    </Box>
  );
};
