-- Add address_line2 column to clients table (required by parser address splitting)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_line2 text;
