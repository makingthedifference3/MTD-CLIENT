import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CSRPartner {
  id: string;
  name: string;
  company_name: string;
  website: string;
  logo_url?: string;
  primary_color?: string;
  metadata?: Record<string, unknown>;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  csr_partner_id: string;
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
  targets?: Record<string, number>;
  achievements?: Record<string, number>;
}

export interface Timeline {
  id: string;
  project_id: string;
  title: string;
  start_date: string;
  end_date: string;
  completion_percentage: number;
  color: string;
  order_index: number;
}

export interface BudgetUtilization {
  id: string;
  project_id: string;
  utilized_amount: number;
  pending_amount: number;
  utilization_percentage: number;
}

export interface RealTimeUpdate {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  date: string;
  beneficiaries_count: number;
  is_featured: boolean;
  is_downloadable: boolean;
}

export interface Report {
  id: string;
  project_id: string;
  report_code: string;
  title: string;
  description?: string;
  period_from?: string;
  period_to?: string;
  report_drive_link?: string;
  generated_date: string;
}

export interface MediaArticle {
  id: string;
  project_id: string;
  title: string;
  media_type: string;
  is_geo_tagged: boolean;
  captured_at: string;
  is_downloadable: boolean;
  is_featured: boolean;
  drive_link?: string;
}
