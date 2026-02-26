/*
  # Add tab category to custom analysis fields

  1. Changes
    - Add `tab_category` column to `custom_analysis_fields` table
      - Type: text with default value 'basic'
      - Purpose: Allows users to assign custom fields to specific tabs (basic, business, culture, memo)
  
  2. Notes
    - Default value is 'basic' to maintain backward compatibility
    - Valid values: 'basic', 'business', 'culture', 'memo'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_analysis_fields' AND column_name = 'tab_category'
  ) THEN
    ALTER TABLE custom_analysis_fields ADD COLUMN tab_category text DEFAULT 'basic';
  END IF;
END $$;
