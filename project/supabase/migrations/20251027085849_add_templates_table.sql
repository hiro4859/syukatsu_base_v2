/*
  # Add templates table for ES and interview templates

  1. New Tables
    - `templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `type` (text, either 'es' or 'interview')
      - `theme` (text, template theme/title)
      - `content` (text, template content)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `templates` table
    - Add policies for authenticated users to manage their own templates
*/

CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('es', 'interview')),
  theme text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);