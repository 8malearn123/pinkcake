-- Add new role: customer_support (separate transaction)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer_support';