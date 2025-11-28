-- Add warning label and management guidelines PDF fields to msds_items table
ALTER TABLE msds_items 
ADD COLUMN IF NOT EXISTS warning_label_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS warning_label_pdf_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS management_guidelines_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS management_guidelines_pdf_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row changes
DROP TRIGGER IF EXISTS update_msds_items_updated_at ON msds_items;
CREATE TRIGGER update_msds_items_updated_at
    BEFORE UPDATE ON msds_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ensure all existing rows have updated_at value
UPDATE msds_items SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP) WHERE updated_at IS NULL;
