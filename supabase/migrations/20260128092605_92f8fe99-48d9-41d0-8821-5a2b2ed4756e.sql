-- Create order_notes table for internal notes
CREATE TABLE public.order_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  note_content text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

-- Notes are immutable - cannot be updated or deleted
CREATE POLICY "Notes cannot be updated"
  ON public.order_notes FOR UPDATE
  USING (false);

CREATE POLICY "Notes cannot be deleted"
  ON public.order_notes FOR DELETE
  USING (false);

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to order_notes"
  ON public.order_notes FOR SELECT
  USING (false);

-- Allow authorized roles to view notes
CREATE POLICY "Authorized users can view order notes"
  ON public.order_notes FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      public.is_admin(auth.uid()) OR
      public.has_role(auth.uid(), 'call_center') OR
      public.has_role(auth.uid(), 'kitchen') OR
      (public.has_role(auth.uid(), 'branch') AND EXISTS (
        SELECT 1 FROM public.orders o 
        WHERE o.id = order_notes.order_id 
        AND o.branch_id = public.get_user_branch_id(auth.uid())
      ))
    )
  );

-- Allow authorized roles to add notes
CREATE POLICY "Authorized users can add order notes"
  ON public.order_notes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = auth.uid() AND (
      public.is_admin(auth.uid()) OR
      public.has_role(auth.uid(), 'call_center') OR
      public.has_role(auth.uid(), 'kitchen') OR
      public.has_role(auth.uid(), 'branch')
    )
  );

-- Create secure function to get order notes with user info
CREATE OR REPLACE FUNCTION public.get_order_notes(_order_id uuid)
RETURNS TABLE(
  id uuid,
  note_content text,
  created_at timestamp with time zone,
  user_name text,
  user_role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    n.id,
    n.note_content,
    n.created_at,
    COALESCE(p.full_name, 'غير معروف') as user_name,
    COALESCE(
      (SELECT string_agg(
        CASE r.role
          WHEN 'admin' THEN 'مدير النظام'
          WHEN 'call_center' THEN 'الكول سنتر'
          WHEN 'kitchen' THEN 'المطبخ'
          WHEN 'branch' THEN 'مدير الفرع'
          ELSE r.role::text
        END, ', '
      ) FROM public.user_roles r WHERE r.user_id = n.created_by),
      'غير محدد'
    ) as user_role
  FROM public.order_notes n
  LEFT JOIN public.profiles p ON p.id = n.created_by
  WHERE n.order_id = _order_id
    AND (
      public.is_admin(auth.uid()) OR
      public.has_role(auth.uid(), 'call_center') OR
      public.has_role(auth.uid(), 'kitchen') OR
      (public.has_role(auth.uid(), 'branch') AND EXISTS (
        SELECT 1 FROM public.orders o 
        WHERE o.id = _order_id 
        AND o.branch_id = public.get_user_branch_id(auth.uid())
      ))
    )
  ORDER BY n.created_at DESC
$$;

-- Create secure function to get order logs with user info
CREATE OR REPLACE FUNCTION public.get_order_logs_with_user(_order_id uuid)
RETURNS TABLE(
  id uuid,
  action text,
  description text,
  created_at timestamp with time zone,
  user_name text,
  user_role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    l.id,
    l.action,
    l.description,
    l.created_at,
    COALESCE(p.full_name, 'النظام') as user_name,
    COALESCE(
      (SELECT string_agg(
        CASE r.role
          WHEN 'admin' THEN 'مدير النظام'
          WHEN 'call_center' THEN 'الكول سنتر'
          WHEN 'kitchen' THEN 'المطبخ'
          WHEN 'branch' THEN 'مدير الفرع'
          ELSE r.role::text
        END, ', '
      ) FROM public.user_roles r WHERE r.user_id = l.performed_by),
      'تلقائي'
    ) as user_role
  FROM public.order_logs l
  LEFT JOIN public.profiles p ON p.id = l.performed_by
  WHERE l.order_id = _order_id
    AND (
      public.is_admin(auth.uid()) OR
      public.has_role(auth.uid(), 'call_center') OR
      public.has_role(auth.uid(), 'kitchen') OR
      (public.has_role(auth.uid(), 'branch') AND EXISTS (
        SELECT 1 FROM public.orders o 
        WHERE o.id = _order_id 
        AND o.branch_id = public.get_user_branch_id(auth.uid())
      ))
    )
  ORDER BY l.created_at DESC
$$;

-- Create function to add internal note
CREATE OR REPLACE FUNCTION public.add_order_note(_order_id uuid, _note_content text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _note_id uuid;
BEGIN
  -- Validate access
  IF NOT (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'call_center') OR
    public.has_role(auth.uid(), 'kitchen') OR
    (public.has_role(auth.uid(), 'branch') AND EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = _order_id 
      AND o.branch_id = public.get_user_branch_id(auth.uid())
    ))
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بإضافة ملاحظات';
  END IF;
  
  -- Validate content
  IF _note_content IS NULL OR trim(_note_content) = '' THEN
    RAISE EXCEPTION 'محتوى الملاحظة مطلوب';
  END IF;
  
  -- Insert note
  INSERT INTO public.order_notes (order_id, note_content, created_by)
  VALUES (_order_id, trim(_note_content), auth.uid())
  RETURNING id INTO _note_id;
  
  -- Log the action
  INSERT INTO public.order_logs (order_id, action, description, performed_by)
  VALUES (_order_id, 'note_added', 'تمت إضافة ملاحظة داخلية', auth.uid());
  
  RETURN _note_id;
END;
$$;

-- Create function to transfer order between branches/kitchen
CREATE OR REPLACE FUNCTION public.transfer_order(
  _order_id uuid,
  _to_branch_id uuid,
  _transfer_type text DEFAULT 'kitchen_to_branch'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _from_location text;
  _to_location text;
  _current_branch_id uuid;
BEGIN
  -- Only admin and kitchen can transfer
  IF NOT (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'kitchen')
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بنقل الطلبات';
  END IF;
  
  -- Get current branch
  SELECT branch_id INTO _current_branch_id FROM public.orders WHERE id = _order_id;
  
  -- Get location names
  IF _current_branch_id IS NOT NULL THEN
    SELECT name INTO _from_location FROM public.branches WHERE id = _current_branch_id;
  ELSE
    _from_location := 'المطبخ المركزي';
  END IF;
  
  SELECT name INTO _to_location FROM public.branches WHERE id = _to_branch_id;
  
  -- Update order branch
  UPDATE public.orders
  SET branch_id = _to_branch_id, status = 'in_transit'
  WHERE id = _order_id;
  
  -- Log the transfer
  INSERT INTO public.order_logs (order_id, action, description, performed_by)
  VALUES (
    _order_id, 
    'transferred', 
    'تم نقل الطلب من ' || _from_location || ' إلى ' || _to_location,
    auth.uid()
  );
  
  RETURN true;
END;
$$;