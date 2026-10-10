-- Add last_payment_at to recurring_subscriptions
ALTER TABLE recurring_subscriptions ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP WITH TIME ZONE;
