-- Verify and add missing columns for warning labels and management guidelines
-- First, check if columns exist and add them if missing

-- Add warning_label_pdf_url if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'msds_items' 
        AND column_name = 'warning_label_pdf_url'
    ) THEN
        ALTER TABLE msds_items ADD COLUMN warning_label_pdf_url TEXT;
    END IF;
END $$;

-- Add warning_label_pdf_name if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'msds_items' 
        AND column_name = 'warning_label_pdf_name'
    ) THEN
        ALTER TABLE msds_items ADD COLUMN warning_label_pdf_name TEXT;
    END IF;
END $$;

-- Add management_guidelines_pdf_url if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'msds_items' 
        AND column_name = 'management_guidelines_pdf_url'
    ) THEN
        ALTER TABLE msds_items ADD COLUMN management_guidelines_pdf_url TEXT;
    END IF;
END $$;

-- Add management_guidelines_pdf_name if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'msds_items' 
        AND column_name = 'management_guidelines_pdf_name'
    ) THEN
        ALTER TABLE msds_items ADD COLUMN management_guidelines_pdf_name TEXT;
    END IF;
END $$;

-- Add updated_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'msds_items' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE msds_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Create or replace the trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_msds_items_updated_at ON msds_items;

-- Create trigger for automatic updated_at updates
CREATE TRIGGER update_msds_items_updated_at
    BEFORE UPDATE ON msds_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing rows to have current timestamp if updated_at is null
UPDATE msds_items SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
