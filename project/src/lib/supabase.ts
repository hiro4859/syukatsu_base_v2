import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Company = {
  id: string;
  name: string;
  industry: string;
  website: string;
  description: string;
  location: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  image_url: string;
  mypage_id: string;
  mypage_password: string;
  selection_process: string;
  current_status: string;
  next_selection_date: string | null;
  es_deadline: string | null;
  webtest_deadline: string | null;
  webtest_format: string;
  memo: string;
  motivation_level: number;
  revenue: string;
  employee_count: string;
  capital: string;
  philosophy: string;
  products: string;
  business_content: string;
  department_operations: string;
  career_plan: string;
  company_culture: string;
  competitive_comparison: string;
  growth_potential: string;
  hiring_count: string;
  average_salary: string;
  benefits: string;
  average_tenure: string;
  overtime_hours: string;
  commercials: string;
  mid_term_plan: string;
};

export type Application = {
  id: string;
  company_id: string;
  user_id: string;
  position: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected';
  applied_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  application_id: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type EntrySheet = {
  id: string;
  company_id: string;
  user_id: string;
  theme: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Interview = {
  id: string;
  company_id: string;
  user_id: string;
  theme: string;
  content: string;
  script: string;
  actual_qa: string;
  answer_satisfaction: number | null;
  manner_evaluation: number | null;
  interviewer_reaction: string;
  improvement_notes: string;
  created_at: string;
  updated_at: string;
};

export type SelectionStep = {
  id: string;
  company_id: string;
  step_name: string;
  memo: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type Template = {
  id: string;
  user_id: string;
  type: 'es' | 'interview';
  theme: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type CustomAnalysisField = {
  id: string;
  user_id: string;
  field_name: string;
  field_key: string;
  order_index: number;
  is_active: boolean;
  tab_category: string;
  created_at: string;
  updated_at: string;
};

export type CompanyCustomField = {
  id: string;
  company_id: string;
  field_key: string;
  value: string;
  created_at: string;
  updated_at: string;
};

export type UserProfile = {
  id: string;
  full_name: string;
  university: string;
  department: string;
  graduation_year: number | null;
  created_at: string;
  updated_at: string;
};
