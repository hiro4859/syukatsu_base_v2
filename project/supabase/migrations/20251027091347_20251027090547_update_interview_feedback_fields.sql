/*
  # Update interview feedback structure

  1. Changes to `interviews` table
    - Rename `questions_asked` to `actual_qa` (text, for actual questions and answers)
    - Add `answer_satisfaction` (integer, 1-5 scale for answer quality)
    - Add `manner_evaluation` (integer, 1-5 scale for speaking manner)
    - Add `interviewer_reaction` (text, for interviewer's reactions)
    - Add `improvement_notes` (text, for improvement points)

  2. Notes
    - Uses safe column operations to avoid data loss
    - Maintains backward compatibility where possible
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interviews' AND column_name = 'questions_asked'
  ) THEN
    ALTER TABLE interviews RENAME COLUMN questions_asked TO actual_qa;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interviews' AND column_name = 'answer_satisfaction'
  ) THEN
    ALTER TABLE interviews ADD COLUMN answer_satisfaction integer CHECK (answer_satisfaction >= 1 AND answer_satisfaction <= 5);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interviews' AND column_name = 'manner_evaluation'
  ) THEN
    ALTER TABLE interviews ADD COLUMN manner_evaluation integer CHECK (manner_evaluation >= 1 AND manner_evaluation <= 5);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interviews' AND column_name = 'interviewer_reaction'
  ) THEN
    ALTER TABLE interviews ADD COLUMN interviewer_reaction text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interviews' AND column_name = 'improvement_notes'
  ) THEN
    ALTER TABLE interviews ADD COLUMN improvement_notes text DEFAULT '';
  END IF;
END $$;