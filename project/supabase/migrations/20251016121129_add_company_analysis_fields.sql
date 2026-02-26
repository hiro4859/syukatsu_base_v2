/*
  # Add Company Analysis Fields

  1. Changes
    - Add new columns to companies table for detailed company analysis:
      - revenue (売上)
      - employee_count (従業員数)
      - capital (資本金)
      - philosophy (理念)
      - products (製品)
      - business_content (事業内容)
      - department_operations (部門業務)
      - career_plan (キャリアプラン)
      - company_culture (社風)
      - competitive_comparison (競合比較)
      - growth_potential (成長性)
      - hiring_count (採用数)
      - average_salary (年収)
      - benefits (福利厚生)
      - average_tenure (平均勤続年数)
      - overtime_hours (残業時間)
      - commercials (CM)
      - mid_term_plan (中期経営計画)

  2. Notes
    - All new fields are optional (nullable) to allow gradual data entry
    - Text fields for flexible content entry
*/

DO $$
BEGIN
  -- Add revenue field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'revenue'
  ) THEN
    ALTER TABLE companies ADD COLUMN revenue text;
  END IF;

  -- Add employee_count field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'employee_count'
  ) THEN
    ALTER TABLE companies ADD COLUMN employee_count text;
  END IF;

  -- Add capital field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'capital'
  ) THEN
    ALTER TABLE companies ADD COLUMN capital text;
  END IF;

  -- Add philosophy field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'philosophy'
  ) THEN
    ALTER TABLE companies ADD COLUMN philosophy text;
  END IF;

  -- Add products field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'products'
  ) THEN
    ALTER TABLE companies ADD COLUMN products text;
  END IF;

  -- Add business_content field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'business_content'
  ) THEN
    ALTER TABLE companies ADD COLUMN business_content text;
  END IF;

  -- Add department_operations field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'department_operations'
  ) THEN
    ALTER TABLE companies ADD COLUMN department_operations text;
  END IF;

  -- Add career_plan field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'career_plan'
  ) THEN
    ALTER TABLE companies ADD COLUMN career_plan text;
  END IF;

  -- Add company_culture field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'company_culture'
  ) THEN
    ALTER TABLE companies ADD COLUMN company_culture text;
  END IF;

  -- Add competitive_comparison field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'competitive_comparison'
  ) THEN
    ALTER TABLE companies ADD COLUMN competitive_comparison text;
  END IF;

  -- Add growth_potential field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'growth_potential'
  ) THEN
    ALTER TABLE companies ADD COLUMN growth_potential text;
  END IF;

  -- Add hiring_count field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'hiring_count'
  ) THEN
    ALTER TABLE companies ADD COLUMN hiring_count text;
  END IF;

  -- Add average_salary field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'average_salary'
  ) THEN
    ALTER TABLE companies ADD COLUMN average_salary text;
  END IF;

  -- Add benefits field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'benefits'
  ) THEN
    ALTER TABLE companies ADD COLUMN benefits text;
  END IF;

  -- Add average_tenure field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'average_tenure'
  ) THEN
    ALTER TABLE companies ADD COLUMN average_tenure text;
  END IF;

  -- Add overtime_hours field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'overtime_hours'
  ) THEN
    ALTER TABLE companies ADD COLUMN overtime_hours text;
  END IF;

  -- Add commercials field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'commercials'
  ) THEN
    ALTER TABLE companies ADD COLUMN commercials text;
  END IF;

  -- Add mid_term_plan field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'mid_term_plan'
  ) THEN
    ALTER TABLE companies ADD COLUMN mid_term_plan text;
  END IF;
END $$;