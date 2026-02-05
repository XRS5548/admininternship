export interface InternshipSkill {
  name: string;
  level: 'Basic' | 'Intermediate' | 'Advanced';
}

export interface Internship {
  id: number;
  title: string;
  description: string;
  domain: string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  price: number;
  banner_url: string | null;
  mode: 'virtual' | 'physical';
  location: string | null;
  skills: InternshipSkill[];
  certificate: boolean;
  certificate_title: string | null;
  status: 'active' | 'upcoming' | 'expired';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
}

export interface InternshipFilters {
  domain?: string;
  mode?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  hasCertificate?: boolean;
}