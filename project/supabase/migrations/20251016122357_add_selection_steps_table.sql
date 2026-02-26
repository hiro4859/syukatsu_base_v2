/*
  # Add selection steps table

  1. New Tables
    - `selection_steps`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `step_name` (text) - Name of the selection step
      - `memo` (text) - Notes for this step
      - `order_index` (integer) - Order of the step
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `selection_steps` table
    - Add policy for authenticated users to manage their own company's selection steps
*/

CREATE TABLE IF NOT EXISTS selection_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  step_name text NOT NULL DEFAULT '',
  memo text DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE selection_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view selection steps of own companies"
  ON selection_steps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = selection_steps.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert selection steps for own companies"
  ON selection_steps FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = selection_steps.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update selection steps of own companies"
  ON selection_steps FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = selection_steps.company_id
      AND companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = selection_steps.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete selection steps of own companies"
  ON selection_steps FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = selection_steps.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_selection_steps_company_id ON selection_steps(company_id);
CREATE INDEX IF NOT EXISTS idx_selection_steps_order ON selection_steps(company_id, order_index);
