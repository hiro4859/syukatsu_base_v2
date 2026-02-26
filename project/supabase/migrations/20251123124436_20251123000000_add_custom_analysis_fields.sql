/*
  # Add Custom Analysis Fields Table

  1. New Tables
    - `custom_analysis_fields`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users) - Owner of the custom field
      - `field_name` (text) - Display name of the custom field
      - `field_key` (text) - Unique key for the field
      - `order_index` (integer) - Display order
      - `is_active` (boolean) - Whether the field is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `company_custom_fields`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `field_key` (text) - Reference to custom_analysis_fields.field_key
      - `value` (text) - Value for this custom field
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only manage their own custom fields
    - Users can only access custom field values for their own companies

  3. Important Notes
    - Custom fields are user-specific
    - Each user can create their own analysis fields
    - Default fields from the companies table remain available
*/

CREATE TABLE IF NOT EXISTS custom_analysis_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  field_name text NOT NULL,
  field_key text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, field_key)
);

CREATE TABLE IF NOT EXISTS company_custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  field_key text NOT NULL,
  value text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, field_key)
);

ALTER TABLE custom_analysis_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom fields"
  ON custom_analysis_fields FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom fields"
  ON custom_analysis_fields FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom fields"
  ON custom_analysis_fields FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom fields"
  ON custom_analysis_fields FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view custom field values for own companies"
  ON company_custom_fields FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_custom_fields.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert custom field values for own companies"
  ON company_custom_fields FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_custom_fields.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update custom field values for own companies"
  ON company_custom_fields FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_custom_fields.company_id
      AND companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_custom_fields.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete custom field values for own companies"
  ON company_custom_fields FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_custom_fields.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_custom_analysis_fields_user_id ON custom_analysis_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_analysis_fields_order ON custom_analysis_fields(user_id, order_index);
CREATE INDEX IF NOT EXISTS idx_company_custom_fields_company_id ON company_custom_fields(company_id);
CREATE INDEX IF NOT EXISTS idx_company_custom_fields_field_key ON company_custom_fields(company_id, field_key);