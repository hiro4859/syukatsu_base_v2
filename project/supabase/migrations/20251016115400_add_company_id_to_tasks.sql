-- Add company_id to tasks table
-- Allow tasks to link directly to companies instead of only through applications

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Make application_id nullable since we now use company_id
ALTER TABLE tasks ALTER COLUMN application_id DROP NOT NULL;
