export interface Question {
  id: string;
  text: string;
  type: 'single_choice' | 'multiple_choice';
  options: string[];
}

export interface Survey {
  id: string;
  title: string;
  type: 'guest' | 'daily';
  questions: Question[];
}

export interface Answer {
  questionId: string;
  answer: string;
}

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  gender?: string;
  nationality?: string;
  area?: string;
  dob?: Date;
}

export interface UserProfile extends User {
  totalPoints: number;
  surveyCount: number;
  streak: number;
}


