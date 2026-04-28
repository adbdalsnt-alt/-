export type GradeLevel = 
  | '1st_primary' | '2nd_primary' | '3rd_primary' | '4th_primary' | '5th_primary' | '6th_primary'
  | '1st_intermediate' | '2nd_intermediate' | '3rd_intermediate'
  | '4th_scientific' | '5th_scientific' | '6th_scientific';

export interface SubjectResult {
  [key: string]: number | undefined;
}

export interface Student {
  id?: string;
  name: string;
  grade: GradeLevel;
  section: string;
  examNumber: string;
  schoolName: string;
  results: SubjectResult;
  createdAt: any;
  updatedAt: any;
}

export interface Attachment {
  data: string; // base64
  mimeType: string;
  name?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  attachments?: Attachment[];
}
