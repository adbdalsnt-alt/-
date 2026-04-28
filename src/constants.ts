import { GradeLevel } from "./types";

export const SUBJECTS_BY_GRADE: Record<GradeLevel, string[]> = {
  '1st_primary': ['islamic', 'arabic', 'english', 'math', 'science', 'pe', 'art'],
  '2nd_primary': ['islamic', 'arabic', 'english', 'math', 'science', 'pe', 'art'],
  '3rd_primary': ['islamic', 'arabic', 'english', 'math', 'science', 'pe', 'art'],
  '4th_primary': ['islamic', 'arabic', 'english', 'math', 'socialStudies', 'science', 'pe', 'art'],
  '5th_primary': ['islamic', 'arabic', 'english', 'math', 'socialStudies', 'science', 'pe', 'art'],
  '6th_primary': ['islamic', 'arabic', 'rules', 'english', 'math', 'socialStudies', 'science', 'pe', 'art'],
  
  '1st_intermediate': ['islamic', 'arabic', 'english', 'math', 'socialStudies', 'science', 'computer', 'pe', 'art'],
  '2nd_intermediate': ['islamic', 'arabic', 'english', 'math', 'socialStudies', 'science', 'computer', 'pe', 'art'],
  '3rd_intermediate': ['islamic', 'arabic', 'english', 'math', 'socialStudies', 'science', 'pe', 'art'], // Third doesn't have computer as per user
  
  '4th_scientific': ['islamic', 'arabic', 'english', 'math', 'physics', 'chemistry', 'biology', 'computer', 'kurdish', 'pe', 'art'],
  '5th_scientific': ['islamic', 'arabic', 'english', 'math', 'physics', 'chemistry', 'biology', 'computer', 'kurdish', 'pe', 'art'],
  '6th_scientific': ['islamic', 'arabic', 'english', 'math', 'physics', 'chemistry', 'biology', 'pe', 'art'],
};

export const SUBJECT_NAMES: Record<string, string> = {
  islamic: 'التربية الإسلامية',
  arabic: 'اللغة العربية',
  rules: 'القواعد',
  english: 'اللغة الإنجليزية',
  math: 'الرياضيات',
  science: 'العلوم',
  socialStudies: 'الاجتماعيات',
  computer: 'الحاسوب',
  kurdish: 'اللغة الكردية',
  physics: 'الفيزياء',
  chemistry: 'الكيمياء',
  biology: 'الأحياء',
  pe: 'الرياضة',
  art: 'الفنية',
};

export const GRADE_NAMES: Record<GradeLevel, string> = {
  '1st_primary': 'الأول الابتدائي',
  '2nd_primary': 'الثاني الابتدائي',
  '3rd_primary': 'الثالث الابتدائي',
  '4th_primary': 'الرابع الابتدائي',
  '5th_primary': 'الخامس الابتدائي',
  '6th_primary': 'السادس الابتدائي',
  '1st_intermediate': 'الأول المتوسط',
  '2nd_intermediate': 'الثاني المتوسط',
  '3rd_intermediate': 'الثالث المتوسط',
  '4th_scientific': 'الرابع العلمي',
  '5th_scientific': 'الخامس العلمي',
  '6th_scientific': 'السادس العلمي',
};
