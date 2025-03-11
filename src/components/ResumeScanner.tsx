import React, { useState, type ChangeEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Score,
  Spellcheck,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { analyzeResume } from '../services/resumeService';
import { styled } from '@mui/material/styles';

type Severity = 'error' | 'warning' | 'success';

interface AnalysisResult {
  score: number;
  keywords: string[];
  suggestions: {
    text: string;
    severity: Severity;
  }[];
  format: {
    isValid: boolean;
    issues: string[];
  };
}

class FileNotSelectedError extends Error {
  override name = 'FileNotSelectedError';
  
  constructor(message: string) {
    super(message);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, FileNotSelectedError.prototype);
  }
}

const ResumeScanner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  
  const { getRootProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const { data: analysis, isLoading, error } = useQuery<AnalysisResult, Error>({
    queryKey: ['resumeAnalysis', file],
    queryFn: async () => {
      if (!file) {
        throw new FileNotSelectedError('No file selected');
      }
      return analyzeResume(file);
    },
    enabled: !!file,
  });

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        minHeight: '100vh',
        justifyContent: 'center'
      }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 4
          }}
        >
          Resume Scanner
        </Typography>

        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%',
            maxWidth: 800,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Upload your resume for ATS analysis
          </Typography>

          <input
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            id="resume-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="resume-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUpload />}
              sx={{ mb: 3 }}
            >
              Upload Resume
            </Button>
          </label>

          {file && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Selected file: {file.name}
            </Typography>
          )}

          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
              <CircularProgress size={24} />
              <Typography>Analyzing your resume...</Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error instanceof Error ? error.message : 'An error occurred'}
            </Alert>
          )}

          {analysis && (
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Score sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
                <Typography variant="h5">
                  ATS Compatibility Score: {analysis.score}%
                </Typography>
              </Box>

              <Typography variant="h6" gutterBottom>
                Keywords Found:
              </Typography>
              <Box sx={{ mb: 3 }}>
                {analysis.keywords.map((keyword, index) => (
                  <Chip
                    key={index}
                    label={keyword}
                    color="primary"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>

              <Typography variant="h6" gutterBottom>
                Suggestions:
              </Typography>
              <List>
                {analysis.suggestions.map((suggestion, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        {suggestion.severity === 'error' && <ErrorIcon color="error" />}
                        {suggestion.severity === 'warning' && <Warning color="warning" />}
                        {suggestion.severity === 'success' && <CheckCircle color="success" />}
                      </ListItemIcon>
                      <ListItemText primary={suggestion.text} />
                    </ListItem>
                    {index < analysis.suggestions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  ); 
};

export default ResumeScanner; 