import { useState } from 'react';
import { Box, Button, TextField, CircularProgress, Typography, Paper } from '@mui/material';
import { parseAdvancedCv } from '../../utils/cv-parser-advanced';

export function CvParserDebug() {
  const [rawText, setRawText] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleParse = () => {
    setLoading(true);
    try {
      const result = parseAdvancedCv(rawText);
      setJsonOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setJsonOutput(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>CV Parser Debugger</Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {/* Input */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Raw CV Text</Typography>
          <TextField
            fullWidth
            multiline
            minRows={20}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste CV text here..."
            variant="outlined"
            sx={{ fontFamily: 'monospace', fontSize: '12px' }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleParse}
            disabled={loading || !rawText}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Parse CV'}
          </Button>
        </Paper>

        {/* Output */}
        <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>JSON Output</Typography>
          <TextField
            fullWidth
            multiline
            minRows={20}
            value={jsonOutput}
            disabled
            variant="outlined"
            sx={{ fontFamily: 'monospace', fontSize: '11px' }}
          />
        </Paper>
      </Box>
    </Box>
  );
}
