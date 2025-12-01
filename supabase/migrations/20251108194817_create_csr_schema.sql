/*
  # CSR Portal Database Schema
  
  1. New Tables
    - `csr_partners` - CSR partner companies
    - `users` - User accounts with role-based access
    - `projects` - CSR projects with targets and achievements
    - `timelines` - Project timeline entries for Gantt chart
    - `budget_utilization` - Budget tracking per project
    - `real_time_updates` - Live project updates with media
    - `reports` - Project reports with download links
    - `media_articles` - Photos, videos, and articles with metadata
    - `notifications` - User notifications
    - `budget_allocation` - Budget allocation records
    - `project_expenses` - Expense tracking
    - `expense_approvals` - Expense approval workflow
    - `tasks` - Project tasks
    - `task_time_logs` - Time tracking for tasks
    - `activity_logs` - Audit trail
    
  2. Security
    - Enable RLS on all tables
    - Add policies for company-scoped data access
    - Restrict client users to their own company data
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CSR Partners table
CREATE TABLE IF NOT EXISTS csr_partners (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  company_name text NOT NULL,
  website text,
  logo_url text,
  primary_color text DEFAULT '#2b6cb0',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE csr_partners ENABLE ROW LEVEL SECURITY;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'client',
  csr_partner_id uuid REFERENCES csr_partners(id),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  csr_partner_id uuid REFERENCES csr_partners(id) NOT NULL,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  status text DEFAULT 'active',
  location text,
  state text,
  start_date date NOT NULL,
  end_date date,
  total_budget numeric(15,2) DEFAULT 0,
  utilized_budget numeric(15,2) DEFAULT 0,
  targets jsonb DEFAULT '{}',
  achievements jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Timelines table
CREATE TABLE IF NOT EXISTS timelines (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  completion_percentage numeric(5,2) DEFAULT 0,
  is_critical_path boolean DEFAULT false,
  order_index integer DEFAULT 0,
  color text DEFAULT '#8b5cf6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;

-- Budget Utilization table
CREATE TABLE IF NOT EXISTS budget_utilization (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  utilized_amount numeric(15,2) DEFAULT 0,
  pending_amount numeric(15,2) DEFAULT 0,
  utilization_percentage numeric(5,2) DEFAULT 0,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_utilization ENABLE ROW LEVEL SECURITY;

-- Real Time Updates table
CREATE TABLE IF NOT EXISTS real_time_updates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  images text[] DEFAULT '{}',
  videos text[] DEFAULT '{}',
  beneficiaries_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_downloadable boolean DEFAULT true,
  location text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE real_time_updates ENABLE ROW LEVEL SECURITY;

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  report_code text NOT NULL,
  title text NOT NULL,
  description text,
  report_type text DEFAULT 'project',
  period_from date,
  period_to date,
  report_drive_link text,
  file_size text,
  generated_date timestamptz DEFAULT now(),
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Media Articles table
CREATE TABLE IF NOT EXISTS media_articles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  title text NOT NULL,
  description text,
  media_type text NOT NULL,
  drive_link text,
  thumbnail_link text,
  file_format text,
  file_size text,
  is_geo_tagged boolean DEFAULT false,
  geo_location text,
  captured_at timestamptz,
  is_downloadable boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE media_articles ENABLE ROW LEVEL SECURITY;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  link text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Budget Allocation table
CREATE TABLE IF NOT EXISTS budget_allocation (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  category text NOT NULL,
  allocated_amount numeric(15,2) NOT NULL,
  utilized_amount numeric(15,2) DEFAULT 0,
  fiscal_year text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_allocation ENABLE ROW LEVEL SECURITY;

-- Project Expenses table
CREATE TABLE IF NOT EXISTS project_expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  expense_code text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  amount numeric(15,2) NOT NULL,
  expense_date date NOT NULL,
  status text DEFAULT 'pending',
  receipt_link text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;

-- Expense Approvals table
CREATE TABLE IF NOT EXISTS expense_approvals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id uuid REFERENCES project_expenses(id) NOT NULL,
  approved_by uuid REFERENCES users(id),
  approval_status text NOT NULL,
  approval_date timestamptz,
  comments text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expense_approvals ENABLE ROW LEVEL SECURITY;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES users(id),
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Task Time Logs table
CREATE TABLE IF NOT EXISTS task_time_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid REFERENCES tasks(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  hours_spent numeric(5,2) NOT NULL,
  log_date date NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_time_logs ENABLE ROW LEVEL SECURITY;

-- Activity Logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for CSR Partners
CREATE POLICY "Users can view their own partner"
  ON csr_partners FOR SELECT
  TO authenticated
  USING (id IN (SELECT csr_partner_id FROM users WHERE id = auth.uid()));

-- RLS Policies for Users
CREATE POLICY "Users can view users from their partner"
  ON users FOR SELECT
  TO authenticated
  USING (csr_partner_id IN (SELECT csr_partner_id FROM users WHERE id = auth.uid()));

-- RLS Policies for Projects
CREATE POLICY "Users can view their partner's projects"
  ON projects FOR SELECT
  TO authenticated
  USING (csr_partner_id IN (SELECT csr_partner_id FROM users WHERE id = auth.uid()));

-- RLS Policies for Timelines
CREATE POLICY "Users can view timelines of their partner's projects"
  ON timelines FOR SELECT
  TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN users u ON u.csr_partner_id = p.csr_partner_id
    WHERE u.id = auth.uid()
  ));

-- RLS Policies for Budget Utilization
CREATE POLICY "Users can view budget of their partner's projects"
  ON budget_utilization FOR SELECT
  TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN users u ON u.csr_partner_id = p.csr_partner_id
    WHERE u.id = auth.uid()
  ));

-- RLS Policies for Real Time Updates
CREATE POLICY "Users can view updates of their partner's projects"
  ON real_time_updates FOR SELECT
  TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN users u ON u.csr_partner_id = p.csr_partner_id
    WHERE u.id = auth.uid()
  ));

-- RLS Policies for Reports
CREATE POLICY "Users can view reports of their partner's projects"
  ON reports FOR SELECT
  TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN users u ON u.csr_partner_id = p.csr_partner_id
    WHERE u.id = auth.uid()
  ));

-- RLS Policies for Media Articles
CREATE POLICY "Users can view media of their partner's projects"
  ON media_articles FOR SELECT
  TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN users u ON u.csr_partner_id = p.csr_partner_id
    WHERE u.id = auth.uid()
  ));

-- RLS Policies for Notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_csr_partner ON users(csr_partner_id);
CREATE INDEX IF NOT EXISTS idx_projects_csr_partner ON projects(csr_partner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_timelines_project ON timelines(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_utilization_project ON budget_utilization(project_id);
CREATE INDEX IF NOT EXISTS idx_real_time_updates_project ON real_time_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_project ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_media_articles_project ON media_articles(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
