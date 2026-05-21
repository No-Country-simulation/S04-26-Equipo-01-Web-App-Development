import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { PlayArrowOutlined, CheckCircleOutlined } from '@mui/icons-material';
import {
  consolidateMyAssessment,
  generateTestsForProfile,
  getPsychotechnicalTestQuestions,
  getTechnicalTestQuestions,
  getMyAllTestResults,
  submitTechnicalTest,
  submitPsychotechnicalTest,
} from '../services/assessment.service';
import { generateMyLearningPath } from '../services/learning.service';
import type { GeneratedTestsResponseDto, GeneratedTest, AssessmentTestResultEntity, AssessmentTestQuestion, AssessmentQuestionOption } from '../types/assessment.types';

interface AssessmentTestsPanelProps {
  activeTab: 'Tecnica' | 'Psicotecnica' | 'Resultados';
  onTestCompleted?: (testType: 'TECHNICAL' | 'PSYCHOTECHNICAL') => void;
}

export const AssessmentTestsPanel = ({
  activeTab,
  onTestCompleted,
}: AssessmentTestsPanelProps) => {
  const [generatedTests, setGeneratedTests] = useState<GeneratedTestsResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreparingTest, setIsPreparingTest] = useState(false);
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [currentTestAnswers, setCurrentTestAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [testsErrorMessage, setTestsErrorMessage] = useState<string | null>(null);

  const buildFallbackTest = useCallback((
    type: 'TECHNICAL' | 'PSYCHOTECHNICAL',
    questions: AssessmentTestQuestion[],
  ): GeneratedTest => ({
    id: `${type.toLowerCase()}-fallback-test`,
    name:
      type === 'TECHNICAL'
        ? 'Prueba tecnica inicial'
        : 'Prueba psicotecnica inicial',
    description:
      type === 'TECHNICAL'
        ? 'Evaluacion tecnica general generada a partir de preguntas base del sistema.'
        : 'Evaluacion psicotecnica general generada a partir de preguntas base del sistema.',
    type,
    questionCount: questions.length,
    estimatedDurationMin: Math.max(10, Math.ceil(questions.length * 1.5)),
    questions,
  }), []);

  const withFallbackTests = useCallback(async (
    tests: GeneratedTestsResponseDto,
  ): Promise<GeneratedTestsResponseDto> => {
    const nextTests: GeneratedTestsResponseDto = {
      ...tests,
      technicalTests: [...tests.technicalTests],
      psychotechnicalTests: [...tests.psychotechnicalTests],
    };

    if (activeTab === 'Tecnica' && nextTests.technicalTests.length === 0) {
      const technicalQuestions = await getTechnicalTestQuestions().catch(() => []);
      if (technicalQuestions.length > 0) {
        nextTests.technicalTests = [buildFallbackTest('TECHNICAL', technicalQuestions)];
      }
    }

    if (activeTab === 'Psicotecnica' && nextTests.psychotechnicalTests.length === 0) {
      const psychotechnicalQuestions = await getPsychotechnicalTestQuestions().catch(() => []);
      if (psychotechnicalQuestions.length > 0) {
        nextTests.psychotechnicalTests = [
          buildFallbackTest('PSYCHOTECHNICAL', psychotechnicalQuestions),
        ];
      }
    }

    nextTests.totalTests =
      nextTests.technicalTests.length + nextTests.psychotechnicalTests.length;

    return nextTests;
  }, [activeTab, buildFallbackTest]);

  const getTestsForTab = (testsResponse?: GeneratedTestsResponseDto | null): GeneratedTest[] => {
    const source = testsResponse ?? generatedTests;
    if (!source) return [];
    if (activeTab === 'Tecnica') return source.technicalTests;
    if (activeTab === 'Psicotecnica') return source.psychotechnicalTests;
    return [];
  };

  const loadGeneratedTests = useCallback(async (): Promise<GeneratedTestsResponseDto | null> => {
    try {
      setTestsErrorMessage(null);
      const tests = await generateTestsForProfile();
      const normalizedTests = await withFallbackTests(tests);
      setGeneratedTests(normalizedTests);
      return normalizedTests;
    } catch (error) {
      console.error('Error loading assessment data:', error);
      const message = error instanceof Error
        ? error.message
        : 'No fue posible cargar las pruebas en este momento.';
      setTestsErrorMessage(message);
      return null;
    }
  }, [withFallbackTests]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadGeneratedTests();
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [loadGeneratedTests]);

  const handleGenerateAndStartFirstTest = async () => {
    try {
      setIsPreparingTest(true);

      let testsResponse = generatedTests;
      let availableTests = getTestsForTab(testsResponse);

      if (!testsResponse || availableTests.length === 0) {
        testsResponse = await loadGeneratedTests();
        availableTests = getTestsForTab(testsResponse);
      }

      if (availableTests.length === 0) {
        setTestsErrorMessage(
          activeTab === 'Tecnica'
            ? 'No se pudo generar una prueba tecnica todavia. Verifica que tengas skills tecnicas guardadas.'
            : 'No se pudo generar una prueba psicotecnica todavia. Intenta nuevamente en unos segundos.',
        );
        return;
      }

      setCurrentTestId(availableTests[0].id);
      setCurrentTestAnswers({});
    } finally {
      setIsPreparingTest(false);
    }
  };

  const handleStartTest = (testId: string) => {
    setCurrentTestId(testId);
    setCurrentTestAnswers({});
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setCurrentTestAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitTest = async () => {
    if (!currentTestId || !generatedTests) return;

    const test =
      activeTab === 'Tecnica'
        ? generatedTests.technicalTests.find((t: GeneratedTest) => t.id === currentTestId)
        : generatedTests.psychotechnicalTests.find((t: GeneratedTest) => t.id === currentTestId);

    if (!test) return;

    try {
      setIsSubmitting(true);
      const submitFn =
        activeTab === 'Tecnica' ? submitTechnicalTest : submitPsychotechnicalTest;

      await submitFn({
        answers: currentTestAnswers,
      });

      setCurrentTestId(null);
      setCurrentTestAnswers({});
      setSubmitSuccess(`Test "${test.name}" completado exitosamente!`);
      setTimeout(() => setSubmitSuccess(null), 4000);

      if (onTestCompleted) {
        onTestCompleted(activeTab === 'Tecnica' ? 'TECHNICAL' : 'PSYCHOTECHNICAL');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 5 }}>
        <CircularProgress size={24} />
        <Typography sx={{ color: '#5C6F86' }}>
          Cargando pruebas...
        </Typography>
      </Box>
    );
  }

  // View for test execution
  if (currentTestId && generatedTests) {
    const test =
      activeTab === 'Tecnica'
        ? generatedTests.technicalTests.find((t: GeneratedTest) => t.id === currentTestId)
        : generatedTests.psychotechnicalTests.find((t: GeneratedTest) => t.id === currentTestId);

    if (!test) return null;

    const unansweredCount = test.questions.length - Object.keys(currentTestAnswers).length;

    return (
      <Paper
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 3,
          boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Button
            onClick={() => setCurrentTestId(null)}
            sx={{
              mb: 2,
              textTransform: 'none',
              color: '#1F3E69',
              '&:hover': { bgcolor: '#F0F6FF' },
            }}
          >
            {'<- Volver a pruebas'}
          </Button>

          <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: '#1F3E69' }}>
            {test.name}
          </Typography>
          <Typography sx={{ mt: 1, color: '#5C6F86' }}>
            {test.description}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Chip
              label={`${test.questionCount} preguntas`}
              sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600 }}
            />
            <Chip
              label={`~${test.estimatedDurationMin} min`}
              sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 600 }}
            />
            {unansweredCount > 0 && (
              <Chip
                label={`${unansweredCount} sin responder`}
                sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 600 }}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gap: 3 }}>
          {test.questions.map((question: AssessmentTestQuestion, index: number) => (
            <Card key={question.id} sx={{ border: '1px solid #D8E3F0' }}>
              <CardContent>
                <Typography sx={{ fontWeight: 700, color: '#1F3E69', mb: 2 }}>
                  {index + 1}. {question.text}
                </Typography>
                <RadioGroup
                  value={currentTestAnswers[question.id] ?? ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                >
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    {question.options.map((option: AssessmentQuestionOption) => (
                      <FormControlLabel
                        key={option.value}
                        value={option.value}
                        control={
                          <Radio
                            sx={{
                              color: '#1565C0',
                              '&.Mui-checked': { color: '#1565C0' },
                            }}
                          />
                        }
                        label={option.label}
                        sx={{ color: '#2B3F5E' }}
                      />
                    ))}
                  </Box>
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: '1px solid #D8E3F0',
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setCurrentTestId(null)}
            sx={{
              textTransform: 'none',
              borderColor: '#1F3E69',
              color: '#1F3E69',
              fontWeight: 700,
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitTest}
            disabled={unansweredCount > 0 || isSubmitting}
            sx={{
              textTransform: 'none',
              bgcolor: '#1F3E69',
              fontWeight: 700,
              '&:hover': { bgcolor: '#1D3C63' },
              '&:disabled': { bgcolor: '#A0AEC0', color: '#fff' },
            }}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />
                Enviando...
              </>
            ) : (
              'Enviar Respuestas'
            )}
          </Button>
        </Box>
      </Paper>
    );
  }

  // View for test list
  const tests = getTestsForTab();
  const startButtonLabel = activeTab === 'Tecnica'
    ? 'Iniciar prueba tecnica'
    : 'Iniciar prueba psicotecnica';
  const generatedTechnicalSkillsCount = generatedTests?.profile.technicalSkillsCount ?? 0;
  const generatedTotalTests = generatedTests?.totalTests ?? 0;

  if (tests.length === 0) {
    return (
      <Paper
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 3,
          boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
        }}
      >
        <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 800, color: '#1F3E69' }}>
          Pruebas {activeTab === 'Tecnica' ? 'Tecnicas' : 'Psicotecnicas'}
        </Typography>
        <Box sx={{ mt: 4, p: 2, bgcolor: '#FFF3E0', borderRadius: 2, border: '1px solid #FFB74D' }}>
          <Typography sx={{ color: '#E65100', fontWeight: 600 }}>
            {testsErrorMessage || 'No hay pruebas disponibles todavia. Usa el boton para intentar generarla e iniciarla.'}
          </Typography>
          {generatedTests && (
            <Typography sx={{ mt: 1, color: '#9A3412', fontWeight: 500 }}>
              Diagnostico API: skills tecnicas detectadas = {generatedTechnicalSkillsCount}, total de pruebas generadas = {generatedTotalTests}.
            </Typography>
          )}
        </Box>
        <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
          <Button
            variant="contained"
            startIcon={<PlayArrowOutlined />}
            onClick={() => {
              void handleGenerateAndStartFirstTest();
            }}
            disabled={isPreparingTest}
            sx={{
              textTransform: 'none',
              bgcolor: '#1F3E69',
              fontWeight: 700,
              '&:hover': { bgcolor: '#1D3C63' },
            }}
          >
            {isPreparingTest ? 'Preparando prueba...' : startButtonLabel}
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: { xs: 3, md: 5 },
        borderRadius: 3,
        boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
      }}
    >
      <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 800, color: '#1F3E69' }}>
        Pruebas {activeTab === 'Tecnica' ? 'Tecnicas' : 'Psicotecnicas'}
      </Typography>
      <Typography sx={{ mt: 1.2, color: '#5C6F86', maxWidth: 720 }}>
        {activeTab === 'Tecnica'
          ? 'Evaluaciones tecnicas basadas en las skills de tu perfil. Cada prueba incluye preguntas sobre conceptos y practicas de cada skill.'
          : 'Evaluaciones psicotecnicas para medir aptitudes generales, razonamiento logico y habilidades blandas.'}
      </Typography>

      <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
        <Button
          variant="contained"
          startIcon={<PlayArrowOutlined />}
          onClick={() => {
            void handleGenerateAndStartFirstTest();
          }}
          disabled={isPreparingTest}
          sx={{
            textTransform: 'none',
            bgcolor: '#1F3E69',
            fontWeight: 700,
            '&:hover': { bgcolor: '#1D3C63' },
          }}
        >
          {isPreparingTest ? 'Preparando prueba...' : startButtonLabel}
        </Button>
      </Box>

      {submitSuccess && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#E8F5E9', borderRadius: 2, border: '1px solid #4CAF50' }}>
          <Typography sx={{ color: '#2E7D32', fontWeight: 600 }}>
            OK: {submitSuccess}
          </Typography>
        </Box>
      )}

      {testsErrorMessage && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#FFF3E0', borderRadius: 2, border: '1px solid #FFB74D' }}>
          <Typography sx={{ color: '#E65100', fontWeight: 600 }}>
            {testsErrorMessage}
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 4, display: 'grid', gap: 2 }}>
        {tests.map((test) => (
          <Card key={test.id} sx={{ border: '1px solid #D8E3F0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, color: '#1F3E69', mb: 1 }}>
                    {test.name}
                  </Typography>
                  <Typography sx={{ color: '#5C6F86', fontSize: '0.95rem', mb: 2 }}>
                    {test.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`${test.questionCount} preguntas`}
                      size="small"
                      sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600 }}
                    />
                    <Chip
                      label={`~${test.estimatedDurationMin} min`}
                      size="small"
                      sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 600 }}
                    />
                    {test.skillName && (
                      <Chip
                        label={test.skillName}
                        size="small"
                        sx={{ bgcolor: '#F3E5F5', color: '#6A1B9A', fontWeight: 600 }}
                      />
                    )}
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  onClick={() => handleStartTest(test.id)}
                  startIcon={<PlayArrowOutlined />}
                  sx={{
                    textTransform: 'none',
                    bgcolor: '#1F3E69',
                    fontWeight: 700,
                    ml: 2,
                    whiteSpace: 'nowrap',
                    '&:hover': { bgcolor: '#1D3C63' },
                  }}
                >
                  Ejecutar
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Paper>
  );
};

// Component for results view
interface AssessmentResultsPanelProps {
  onRoadmapGenerated?: () => void;
  onContinueToCourses?: () => void;
}

export const AssessmentResultsPanel = ({
  onRoadmapGenerated,
  onContinueToCourses,
}: AssessmentResultsPanelProps) => {
  const [testResults, setTestResults] = useState<AssessmentTestResultEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [roadmapSuccessMessage, setRoadmapSuccessMessage] = useState<string | null>(null);
  const [roadmapErrorMessage, setRoadmapErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const results = await getMyAllTestResults();
        setTestResults(results);
      } catch (error) {
        console.error('Error loading test results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadResults();
  }, []);

  const handleGenerateRoadmap = async () => {
    try {
      setIsGeneratingRoadmap(true);
      setRoadmapSuccessMessage(null);
      setRoadmapErrorMessage(null);

      await consolidateMyAssessment();
      await generateMyLearningPath({});

      setRoadmapSuccessMessage(
        'Assessment consolidado creado y ruta de cursos generada correctamente.',
      );
      if (onRoadmapGenerated) {
        onRoadmapGenerated();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo generar la ruta. Completa pruebas tecnicas y psicotecnicas primero.';
      setRoadmapErrorMessage(message);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 5 }}>
        <CircularProgress size={24} />
        <Typography sx={{ color: '#5C6F86' }}>
          Cargando resultados...
        </Typography>
      </Box>
    );
  }

  if (testResults.length === 0) {
    return (
      <Paper
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 3,
          boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
        }}
      >
        <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: '#1F3E69' }}>
          Resultados de Pruebas
        </Typography>
        <Box sx={{ mt: 4, p: 2, bgcolor: '#FFF3E0', borderRadius: 2, border: '1px solid #FFB74D' }}>
          <Typography sx={{ color: '#E65100', fontWeight: 600 }}>
            No hay resultados de pruebas aun. Completa una prueba para ver los resultados aqui.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: { xs: 3, md: 5 },
        borderRadius: 3,
        boxShadow: '0px 3px 10px rgba(11,38,69,0.08)',
      }}
    >
      <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: '#1F3E69' }}>
        Resultados de Pruebas
      </Typography>

      <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
        <Button
          variant="contained"
          onClick={handleGenerateRoadmap}
          disabled={isGeneratingRoadmap}
          sx={{
            textTransform: 'none',
            bgcolor: '#1F3E69',
            fontWeight: 700,
            '&:hover': { bgcolor: '#1D3C63' },
          }}
        >
          {isGeneratingRoadmap
            ? 'Generando assessment consolidado...'
            : 'Generar Assessment Consolidado y Ruta'}
        </Button>
        <Button
          variant="outlined"
          onClick={onContinueToCourses}
          sx={{
            textTransform: 'none',
            borderColor: '#1F3E69',
            color: '#1F3E69',
            fontWeight: 700,
            '&:hover': { borderColor: '#173A68', bgcolor: '#EDF4FF' },
          }}
        >
          Continuar a mi ruta de cursos
        </Button>
      </Box>

      {roadmapSuccessMessage && (
        <Typography sx={{ mt: 1.5, color: '#166534', fontWeight: 600 }}>
          {roadmapSuccessMessage}
        </Typography>
      )}

      {roadmapErrorMessage && (
        <Typography sx={{ mt: 1.5, color: '#B42318', fontWeight: 600 }}>
          {roadmapErrorMessage}
        </Typography>
      )}

      <Box sx={{ mt: 4, display: 'grid', gap: 2 }}>
        {testResults.map((result) => (
          <Card key={result.id} sx={{ border: '1px solid #D8E3F0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleOutlined sx={{ fontSize: 28, color: '#4CAF50' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, color: '#1F3E69' }}>
                    {result.title}
                  </Typography>
                  <Typography sx={{ color: '#5C6F86', fontSize: '0.9rem', mt: 0.5 }}>
                    {new Date(result.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: '#1565C0' }}>
                    {result.percentage}%
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: '#5C6F86' }}>
                    {result.score}/{result.maxScore}
                  </Typography>
                </Box>
              </Box>
              {result.feedback && (
                <Typography sx={{ mt: 2, p: 1.5, bgcolor: '#F0F6FF', borderRadius: 1, color: '#284D78', fontSize: '0.9rem' }}>
                  {result.feedback}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Paper>
  );
};


