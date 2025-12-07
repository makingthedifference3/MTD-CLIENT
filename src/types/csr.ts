export interface Toll {
  id: string;
  toll_name: string;
  csr_partner_id: string;
}

export interface CSRPartner {
  id: string;
  name: string;
  company_name: string;
  website?: string;
  logo_url?: string;
  primary_color?: string;
  toll_id?: string; // If logged in as a specific toll
  toll_name?: string;
}

export interface User {
  id: string;
  email?: string; // Optional now as we might login via POC name
  username?: string;
  password?: string;
  full_name: string;
  role: string;
  csr_partner_id: string;
  toll_id?: string; // If logged in as a specific toll
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
  direct_beneficiaries?: number;
  indirect_beneficiaries?: number;
  male_beneficiaries?: number;
  female_beneficiaries?: number;
  children_beneficiaries?: number;
  // Actual DB columns
  pads_distributed?: number;
  trees_planted?: number;
  meals_served?: number;
  students_enrolled?: number;
  schools_renovated?: number;
  // These come from project_metrics JSONB, not direct columns
  sessions_conducted?: number;
  libraries_setup?: number;
  scholarships_given?: number;
  ration_kits_distributed?: number;
  families_fed?: number;
  waste_collected_kg?: number;
  plastic_recycled_kg?: number;
  communities_covered?: number;
  targets?: Record<string, number>;
  achievements?: Record<string, number>;
  toll_id?: string;
  parent_project_id?: string;
  is_beneficiary_project?: boolean;
  beneficiary_name?: string;
  impact_metrics?: Array<{ key: string; value: number; customLabel?: string }>;
}

export interface ProjectActivity {
  id: string;
  activity_code: string;
  project_id: string;
  csr_partner_id: string;
  toll_id?: string;
  title: string;
  description?: string;
  section: string;
  section_order: number;
  activity_order: number;
  start_date?: string;
  end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  completion_percentage: number;
  assigned_to?: string;
  responsible_person?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  remarks?: string;
  blockers?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  project_name?: string;
  update_id?: string;
  update_title?: string;
  items?: ProjectActivityItem[];
}

export interface ProjectActivityItem {
  id: string;
  activity_id: string;
  item_text: string;
  item_order: number;
  is_completed: boolean;
  completed_at?: string;
}

export interface Timeline {
  id: string;
  project_id: string;
  title: string;
  start_date?: string;
  end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  completion_percentage: number;
  is_critical_path: boolean;
  color: string;
  status?: string;
}

export interface Report {
  id: string;
  project_id: string;
  title: string;
  date: string;
  drive_link?: string;
}

export interface RealTimeUpdate {
  id: string;
  project_id: string;
  title: string;
  date: string;
  description: string;
  drive_link?: string;
  is_downloadable: boolean;
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
  update_id?: string;
  update_title?: string;
}

export interface Article {
  id: string;
  project_id: string;
  title: string;
  date: string;
  is_featured: boolean;
  drive_link: string;
  update_id?: string;
  update_title?: string;
}
