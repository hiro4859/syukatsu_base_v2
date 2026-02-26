/*
  # Add ES and Interview Tables

  1. New Tables
    - `entry_sheets`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `user_id` (uuid, foreign key to auth.users)
      - `theme` (text) - ES theme/topic
      - `content` (text) - ES content/answer
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `interviews`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `user_id` (uuid, foreign key to auth.users)
      - `theme` (text) - Interview theme/topic
      - `content` (text) - Prepared content for interview
      - `questions_asked` (text) - Questions that were asked during interview
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS entry_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme text DEFAULT '' NOT NULL,
  content text DEFAULT '' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme text DEFAULT '' NOT NULL,
  content text DEFAULT '' NOT NULL,
  questions_asked text DEFAULT '' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE entry_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entry sheets"
  ON entry_sheets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entry sheets"
  ON entry_sheets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entry sheets"
  ON entry_sheets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own entry sheets"
  ON entry_sheets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own interviews"
  ON interviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interviews"
  ON interviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews"
  ON interviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interviews"
  ON interviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);