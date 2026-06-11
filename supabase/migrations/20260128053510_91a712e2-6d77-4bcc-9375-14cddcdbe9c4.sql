-- Migration 1: Add customer role to enum and add user_id column
-- Add 'customer' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';

-- Add user_id column to customers table to link customer accounts to auth
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- Create unique constraint to prevent duplicate customer accounts (allow nulls)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_user_id_unique'
  ) THEN
    ALTER TABLE public.customers ADD CONSTRAINT customers_user_id_unique UNIQUE (user_id);
  END IF;
END $$;