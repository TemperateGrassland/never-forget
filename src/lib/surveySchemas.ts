interface SurveySchema {
  templateName: string;
  question: string;
  possibleAnswers: string[];
}

export const SURVEY_SCHEMAS: SurveySchema[] = [
  {
    templateName: 'ease_feedback',
    question: 'How easy was it to use Never Forget?',
    possibleAnswers: ['Very Easy', 'Easy', 'Neutral', 'Difficult', 'Very Difficult']
  },
  {
    templateName: 'satisfaction_survey', 
    question: 'How satisfied are you with Never Forget?',
    possibleAnswers: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
  },
  {
    templateName: 'feature_feedback',
    question: 'Which feature would you like to see next?',
    possibleAnswers: ['Dark Mode', 'Calendar Integration', 'Voice Reminders', 'Team Sharing', 'Mobile App']
  }
];

export function getSurveySchema(templateName: string): SurveySchema | null {
  return SURVEY_SCHEMAS.find(schema => schema.templateName === templateName) || null;
}

export interface SurveyResponse {
  templateName: string;
  question: string;
  selectedAnswer: string;
  comment?: string;
  timestamp: Date;
}

interface FlowResponseData {
  metadata: {
    templateName?: string;
    [key: string]: unknown;
  } | null;
  responses: {
    selected_answer?: string;
    choice?: string;
    answer?: string;
    comment?: string;
    feedback_text?: string;
    [key: string]: unknown;
  };
  createdAt: Date;
}

export function processSurveyResponses(flowResponses: FlowResponseData[]): SurveyResponse[] {
  return flowResponses.map(response => {
    const metadata = response.metadata;
    const answers = response.responses;
    
    // Safely extract template name from metadata
    const templateName = (metadata && typeof metadata === 'object' && 'templateName' in metadata) 
      ? String(metadata.templateName) 
      : 'unknown';
    
    // Extract the main question response (assuming standardized field names)
    const selectedAnswer = String(answers.selected_answer || answers.choice || answers.answer || '');
    const comment = answers.comment || answers.feedback_text;
    
    return {
      templateName,
      question: extractQuestionFromTemplate(templateName),
      selectedAnswer,
      comment: typeof comment === 'string' ? comment : undefined,
      timestamp: response.createdAt
    };
  });
}

function extractQuestionFromTemplate(templateName: string): string {
  const schema = getSurveySchema(templateName);
  return schema?.question || 'Unknown Question';
}

function getDateFromTimeframe(timeframe: string): Date {
  const now = new Date();
  const days = parseInt(timeframe.replace('d', ''));
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}