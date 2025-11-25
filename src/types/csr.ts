export interface CSRPartner {
  id: string;
  name: string;
  company_name: string;
  website?: string;
  logo_url?: string;
  primary_color?: string;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  role: string;
  csr_partner_id: string;
}

export interface ProjectMetric {
  current: number;
  target: number;
}

export interface Project {
  id: string;
  csr_partner_id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  location?: string;
  state?: string;
  start_date: string;
  end_date?: string;
  total_budget: number;
  utilized_budget: number;
  beneficiaries_current: number;
  beneficiaries_target: number;
  project_metrics?: Record<string, ProjectMetric>;
}

export interface Timeline {
  id: string;
  project_id: string;
  title: string;
  start_date?: string | null;
  end_date?: string | null;
  completion_percentage: number;
  is_critical_path: boolean;
  color: string;
  status?: string;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
}

export interface Report {
  id: string;
  project_id: string;
  title: string;
  date: string;
  drive_link?: string;
}

export interface Media {
  id: string;
  project_id: string;
  title: string;
  type: 'photo' | 'video';
  date: string;
  is_geo_tagged: boolean;
  drive_link: string;
  news_channel?: string;
}

export interface Article {
  id: string;
  project_id: string;
  title: string;
  date: string;
  is_featured: boolean;
  drive_link: string;
}

export interface RealTimeUpdate {
  id: string;
  project_id: string;
  title: string;
  date: string;
  description: string;
  is_downloadable: boolean;
  drive_link?: string;
}
