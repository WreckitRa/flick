// Shared types for Flick

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  gender?: string;
  nationality?: string;
  area?: string;
  dob?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Survey {
  id: string;
  title: string;
  type: 'guest' | 'daily';
  active: boolean;
  questions: Question[];
}

export interface Question {
  id: string;
  surveyId: string;
  text: string;
  type: 'single_choice' | 'multiple_choice';
  options: string[];
}

export interface UserAnswer {
  id: string;
  userId: string;
  questionId: string;
  answer: string;
  createdAt: Date;
}

export interface UserPoint {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  createdAt: Date;
}

export interface SurveySubmission {
  questionId: string;
  answer: string;
}

export interface UserProfile extends User {
  totalPoints: number;
  surveyCount: number;
  streak: number;
}

export interface Insight {
  id: string;
  text: string;
  emoji: string;
  category: string;
}


