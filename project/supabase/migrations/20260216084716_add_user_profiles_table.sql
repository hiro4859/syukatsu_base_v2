/*
  # Add user profiles table

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text) - ユーザーの氏名
      - `university` (text) - 大学名
      - `department` (text) - 学部
      - `graduation_year` (integer) - 卒業予定年度
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policy for users to read their own profile
    - Add policy for users to insert their own profile
    - Add policy for users to update their own profile
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  university text DEFAULT '',
  department text DEFAULT '',
  graduation_year integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);