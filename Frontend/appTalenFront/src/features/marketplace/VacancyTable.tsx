import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';

interface Vacancy {
  id: string;
  title: string;
  modality: string;
  location: string;
}

interface VacancyTableProps {
  vacancies: Vacancy[];
  onSelectVacancy: (id: string) => void;
}

const VacancyTable: React.FC<VacancyTableProps> = ({ vacancies, onSelectVacancy }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Título</TableCell>
            <TableCell>Modalidad</TableCell>
            <TableCell>Ubicación</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vacancies.map((vacancy) => (
            <TableRow key={vacancy.id}>
              <TableCell>{vacancy.title}</TableCell>
              <TableCell>{vacancy.modality}</TableCell>
              <TableCell>{vacancy.location}</TableCell>
              <TableCell>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => onSelectVacancy(vacancy.id)}
                >
                  Preseleccionados
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default VacancyTable;