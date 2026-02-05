export interface Skill {
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface Domain {
  id: number;
  name: string;
  description: string;
  image: string;
  skills: Skill[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}