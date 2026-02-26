/*
  # Add Company Details Fields

  1. Changes to companies table
    - Add `image_url` (text) - Company logo or image URL
    - Add `mypage_id` (text) - Login ID for company mypage
    - Add `mypage_password` (text) - Encrypted password for company mypage
    - Add `selection_process` (text) - Selection process flow description
    - Add `current_status` (text) - Current application status
    - Add `next_selection_date` (date) - Next selection/interview date
    - Add `es_deadline` (date) - ES (Entry Sheet) deadline
    - Add `webtest_deadline` (date) - Web test deadline
    - Add `webtest_format` (text) - Web test format/type
    - Add `memo` (text) - General notes/memo
    - Add `motivation_level` (integer) - Motivation level (1-5)

  2. Important Notes
    - All new fields are optional with default values
    - Passwords should be encrypted on the client side before storage
    - Default motivation level is 3 (middle)
*/

-- Add new columns to companies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE companies ADD COLUMN image_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'mypage_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN mypage_id text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'mypage_password'
  ) THEN
    ALTER TABLE companies ADD COLUMN mypage_password text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'selection_process'
  ) THEN
    ALTER TABLE companies ADD COLUMN selection_process text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'current_status'
  ) THEN
    ALTER TABLE companies ADD COLUMN current_status text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'next_selection_date'
  ) THEN
    ALTER TABLE companies ADD COLUMN next_selection_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'es_deadline'
  ) THEN
    ALTER TABLE companies ADD COLUMN es_deadline date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'webtest_deadline'
  ) THEN
    ALTER TABLE companies ADD COLUMN webtest_deadline date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'webtest_format'
  ) THEN
    ALTER TABLE companies ADD COLUMN webtest_format text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'memo'
  ) THEN
    ALTER TABLE companies ADD COLUMN memo text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'motivation_level'
  ) THEN
    ALTER TABLE companies ADD COLUMN motivation_level integer DEFAULT 3;
  END IF;
END $$;