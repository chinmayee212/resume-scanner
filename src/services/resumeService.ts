import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

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

interface APIResponse {
  hasContactInfo: boolean;
  hasWorkExperience: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
  formatIssues?: string[];
  skills?: string[];
  industryTerms?: string[];
  actionVerbs?: string[];
  strengths?: string[];
}

export const analyzeResume = async (file: File): Promise<AnalysisResult> => {
  try {
    // First, extract text from the resume
    const formData = new FormData();
    formData.append('file', file);

    const textResponse = await axios.post(`${API_URL}/extract-text`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const resumeText = textResponse.data.text;

    // Then, analyze the text using OpenAI
    const analysisResponse = await axios.post<APIResponse>(
      `${API_URL}/analyze`,
      {
        text: resumeText,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
      }
    );

    return {
      score: calculateATSScore(analysisResponse.data),
      keywords: extractKeywords(analysisResponse.data),
      suggestions: generateSuggestions(analysisResponse.data),
      format: validateFormat(analysisResponse.data),
    };
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw new Error('Failed to analyze resume');
  }
};

const calculateATSScore = (analysisData: APIResponse): number => {
  let score = 100;
  
  if (!analysisData.hasContactInfo) score -= 10;
  if (!analysisData.hasWorkExperience) score -= 15;
  if (!analysisData.hasEducation) score -= 10;
  if (!analysisData.hasSkills) score -= 10;
  
  if (analysisData.formatIssues?.length) {
    score -= analysisData.formatIssues.length * 5;
  }
  
  return Math.max(0, Math.min(100, score));
};

const extractKeywords = (analysisData: APIResponse): string[] => {
  const keywords = new Set<string>();
  
  analysisData.skills?.forEach((skill) => keywords.add(skill));
  analysisData.industryTerms?.forEach((term) => keywords.add(term));
  analysisData.actionVerbs?.forEach((verb) => keywords.add(verb));
  
  return Array.from(keywords);
};

const generateSuggestions = (analysisData: APIResponse): { text: string; severity: Severity }[] => {
  const suggestions: { text: string; severity: Severity }[] = [];

  if (!analysisData.hasContactInfo) {
    suggestions.push({
      text: 'Add complete contact information including phone, email, and location',
      severity: 'error',
    });
  }

  if (!analysisData.hasWorkExperience) {
    suggestions.push({
      text: 'Include detailed work experience with measurable achievements',
      severity: 'error',
    });
  }

  if (!analysisData.hasEducation) {
    suggestions.push({
      text: 'Add your educational background',
      severity: 'error',
    });
  }

  if (!analysisData.hasSkills) {
    suggestions.push({
      text: 'List relevant technical and soft skills',
      severity: 'error',
    });
  }

  analysisData.formatIssues?.forEach((issue) => {
    suggestions.push({
      text: issue,
      severity: 'warning',
    });
  });

  analysisData.strengths?.forEach((strength) => {
    suggestions.push({
      text: strength,
      severity: 'success',
    });
  });

  return suggestions;
};

const validateFormat = (analysisData: APIResponse): { isValid: boolean; issues: string[] } => {
  return {
    isValid: !analysisData.formatIssues?.length,
    issues: analysisData.formatIssues || [],
  };
}; 