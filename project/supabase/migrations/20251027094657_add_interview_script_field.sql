/*
  # Add interview script field

  1. Changes to `interviews` table
    - Add `script` (text) - Interview script/台本 to prepare for the interview
  
  2. Notes
    - Safe column addition with IF NOT EXISTS check
    - Default empty string for existing records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interviews' AND column_name = 'script'
  ) THEN
    ALTER TABLE interviews ADD COLUMN script text DEFAULT '';
  END IF;
END $$;