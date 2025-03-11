import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResumeScanner from '../ResumeScanner';

// Create a new QueryClient for testing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock the resumeService
jest.mock('../../services/resumeService', () => ({
  analyzeResume: jest.fn(),
}));

const mockAnalysisResult = {
  score: 85,
  keywords: ['React', 'TypeScript', 'Node.js'],
  suggestions: [
    {
      text: 'Add more details about your experience',
      severity: 'warning' as const,
    },
    {
      text: 'Include your GitHub profile',
      severity: 'error' as const,
    },
  ],
  format: {
    isValid: true,
    issues: [],
  },
};

describe('ResumeScanner Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders the upload button initially', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ResumeScanner />
      </QueryClientProvider>
    );

    expect(screen.getByText('Upload Resume')).toBeInTheDocument();
    expect(screen.getByText('Upload your resume for ATS analysis')).toBeInTheDocument();
  });

  it('handles file selection', async () => {
    const { analyzeResume } = require('../../services/resumeService');
    (analyzeResume as jest.Mock).mockResolvedValue(mockAnalysisResult);

    render(
      <QueryClientProvider client={queryClient}>
        <ResumeScanner />
      </QueryClientProvider>
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload resume/i);
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Selected file: test.pdf')).toBeInTheDocument();
    });
  });

  it('displays loading state while analyzing', async () => {
    const { analyzeResume } = require('../../services/resumeService');
    (analyzeResume as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <QueryClientProvider client={queryClient}>
        <ResumeScanner />
      </QueryClientProvider>
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload resume/i);
    
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('Analyzing your resume...')).toBeInTheDocument();
  });

  it('displays analysis results after successful analysis', async () => {
    const { analyzeResume } = require('../../services/resumeService');
    (analyzeResume as jest.Mock).mockResolvedValue(mockAnalysisResult);

    render(
      <QueryClientProvider client={queryClient}>
        <ResumeScanner />
      </QueryClientProvider>
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload resume/i);
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('ATS Compatibility Score: 85%')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.getByText('Add more details about your experience')).toBeInTheDocument();
      expect(screen.getByText('Include your GitHub profile')).toBeInTheDocument();
    });
  });

  it('displays error message when analysis fails', async () => {
    const { analyzeResume } = require('../../services/resumeService');
    (analyzeResume as jest.Mock).mockRejectedValue(new Error('Analysis failed'));

    render(
      <QueryClientProvider client={queryClient}>
        <ResumeScanner />
      </QueryClientProvider>
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload resume/i);
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Analysis failed')).toBeInTheDocument();
    });
  });
}); 