-- Add savings column to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS savings TEXT;

-- Update seed data to include savings
UPDATE plans SET savings = 'Economize 27%' WHERE id = 'anual';
UPDATE plans SET savings = 'Economize 13%' WHERE id = 'semestral';
