/*
  # Job Hunting Task Management Schema

  1. New Tables
    - `companies`
      - `id` (uuid, primary key) - Unique identifier for each company
      - `name` (text) - Company name
      - `industry` (text) - Industry sector
      - `website` (text) - Company website URL
      - `description` (text) - Company description
      - `location` (text) - Company location
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp
      - `user_id` (uuid) - User who created the company record
    
    - `applications`
      - `id` (uuid, primary key) - Unique identifier for each application
      - `company_id` (uuid, foreign key) - Reference to companies table
      - `user_id` (uuid) - User who owns the application
      - `position` (text) - Position applied for
      - `status` (text) - Application status (applied, interview, offer, rejected)
      - `applied_date` (date) - Date of application
      - `notes` (text) - Additional notes
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp
    
    - `tasks`
      - `id` (uuid, primary key) - Unique identifier for each task
      - `application_id` (uuid, foreign key) - Reference to applications table
      - `user_id` (uuid) - User who owns the task
      - `title` (text) - Task title
      - `description` (text) - Task description
      - `due_date` (date) - Task due date
      - `completed` (boolean) - Task completion status
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own companies, applications, and tasks

  3. Important Notes
    - All tables include user_id for data isolation
    - Timestamps are automatically managed
    - Foreign key constraints ensure data integrity
    - Default values prevent null issues
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text DEFAULT '',
  website text DEFAULT '',
  description text DEFAULT '',
  location text DEFAULT '',
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position text NOT NULL,
  status text DEFAULT 'applied',
  applied_date date DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  due_date date,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies table
CREATE POLICY "Users can view own companies"
  ON companies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies"
  ON companies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for applications table
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON applications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for tasks table
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_company_id ON applications(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_application_id ON tasks(application_id);