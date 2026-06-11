-- Add handover tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_type text DEFAULT 'pickup',
ADD COLUMN IF NOT EXISTS status_changed_by uuid,
ADD COLUMN IF NOT EXISTS status_changed_role text,
ADD COLUMN IF NOT EXISTS status_changed_at timestamptz,
ADD COLUMN IF NOT EXISTS admin_override boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_override_reason text,
ADD COLUMN IF NOT EXISTS assigned_driver_id uuid,
ADD COLUMN IF NOT EXISTS handover_from_kitchen boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS handover_kitchen_time timestamptz,
ADD COLUMN IF NOT EXISTS handover_kitchen_by_driver uuid,
ADD COLUMN IF NOT EXISTS handover_to_branch boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS handover_branch_time timestamptz,
ADD COLUMN IF NOT EXISTS handover_branch_by uuid,
ADD COLUMN IF NOT EXISTS delivered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS delivered_time timestamptz,
ADD COLUMN IF NOT EXISTS delivered_by_driver uuid;

-- Create handover barcodes table for tracking single-use barcodes
CREATE TABLE IF NOT EXISTS public.handover_barcodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  barcode_type text NOT NULL CHECK (barcode_type IN ('kitchen_handover', 'branch_handover', 'customer_delivery')),
  barcode_code text NOT NULL UNIQUE,
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  scanned boolean DEFAULT false,
  scanned_at timestamptz,
  scanned_by uuid,
  scanned_by_role text,
  is_valid boolean DEFAULT true,
  UNIQUE (order_id, barcode_type)
);

-- Enable RLS on handover_barcodes
ALTER TABLE public.handover_barcodes ENABLE ROW LEVEL SECURITY;

-- Create barcode scan audit log table
CREATE TABLE IF NOT EXISTS public.barcode_scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  barcode_type text NOT NULL,
  barcode_code text NOT NULL,
  scanned_by uuid NOT NULL,
  scanned_by_role text NOT NULL,
  scan_result text NOT NULL CHECK (scan_result IN ('success', 'rejected_wrong_role', 'rejected_already_used', 'rejected_expired', 'rejected_invalid')),
  rejection_reason text,
  scanned_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on barcode_scan_logs
ALTER TABLE public.barcode_scan_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for handover_barcodes
CREATE POLICY "Deny anonymous access to handover_barcodes"
ON public.handover_barcodes AS RESTRICTIVE FOR SELECT
USING (false);

CREATE POLICY "Kitchen can view kitchen barcodes"
ON public.handover_barcodes FOR SELECT
USING (
  barcode_type = 'kitchen_handover' 
  AND public.has_role(auth.uid(), 'kitchen')
);

CREATE POLICY "Driver can view branch and kitchen barcodes for scanning"
ON public.handover_barcodes FOR SELECT
USING (
  barcode_type IN ('kitchen_handover', 'branch_handover')
  AND public.has_role(auth.uid(), 'driver')
);

CREATE POLICY "Branch can view branch barcodes for their orders"
ON public.handover_barcodes FOR SELECT
USING (
  barcode_type = 'branch_handover'
  AND public.has_role(auth.uid(), 'branch')
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = handover_barcodes.order_id
    AND o.branch_id = public.get_user_branch_id(auth.uid())
  )
);

CREATE POLICY "Customers can view their delivery barcodes"
ON public.handover_barcodes FOR SELECT
USING (
  barcode_type = 'customer_delivery'
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = handover_barcodes.order_id
    AND o.customer_id = public.get_my_customer_id()
  )
);

CREATE POLICY "Admin can view all barcodes"
ON public.handover_barcodes FOR SELECT
USING (public.is_admin(auth.uid()));

-- RLS for barcode_scan_logs
CREATE POLICY "Deny anonymous access to barcode_scan_logs"
ON public.barcode_scan_logs AS RESTRICTIVE FOR SELECT
USING (false);

CREATE POLICY "Admin can view all scan logs"
ON public.barcode_scan_logs FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Staff can view logs for their orders"
ON public.barcode_scan_logs FOR SELECT
USING (
  public.has_role(auth.uid(), 'kitchen')
  OR public.has_role(auth.uid(), 'driver')
  OR public.has_role(auth.uid(), 'branch')
);

CREATE POLICY "Logs inserted via function only"
ON public.barcode_scan_logs AS RESTRICTIVE FOR INSERT
WITH CHECK (false);