/*
  # Add personal analysis memo field

  1. Changes
    - Add `personal_analysis_memo` column to `companies` table
      - Type: text (nullable)
      - Purpose: Store personal analysis notes and memos for each company
  
  2. Notes
    - This field allows users to maintain personal analysis notes separate from other structured data
    - Existing data is preserved
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'personal_analysis_memo'
  ) THEN
    ALTER TABLE companies ADD COLUMN personal_analysis_memo text;
  END IF;
END $$;
