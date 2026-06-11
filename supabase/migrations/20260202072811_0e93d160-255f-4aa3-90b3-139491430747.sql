-- Add new order status values for custom orders
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'custom_pending_review';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'custom_chef_approved';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'custom_rejected';

-- Create custom order details table
CREATE TABLE public.custom_order_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  product_type text NOT NULL,
  occasion text,
  number_of_people integer,
  flavor text,
  filling text,
  sugar_level text,
  design_description text,
  writing_text text,
  reference_image_url text,
  reference_order_id uuid REFERENCES orders(id),
  -- Chef review fields
  chef_reviewed_by uuid,
  chef_reviewed_at timestamptz,
  chef_feasibility text, -- 'feasible', 'not_feasible', 'needs_modification'
  chef_preparation_time text,
  chef_proposed_price numeric,
  chef_notes text,
  chef_rejection_reason text,
  -- Customer confirmation
  customer_confirmed_price boolean DEFAULT false,
  customer_confirmed_at timestamptz,
  confirmed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_order_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_order_details
CREATE POLICY "Deny anonymous access to custom_order_details"
ON public.custom_order_details AS RESTRICTIVE
FOR SELECT USING (false);

CREATE POLICY "Admin full access to custom_order_details"
ON public.custom_order_details AS RESTRICTIVE
FOR ALL USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Customer support can view custom orders"
ON public.custom_order_details AS RESTRICTIVE
FOR SELECT USING (has_role(auth.uid(), 'customer_support'::app_role));

CREATE POLICY "Customer support can create custom orders"
ON public.custom_order_details AS RESTRICTIVE
FOR INSERT WITH CHECK (has_role(auth.uid(), 'customer_support'::app_role));

CREATE POLICY "Kitchen can view and update custom orders"
ON public.custom_order_details AS RESTRICTIVE
FOR ALL USING (has_role(auth.uid(), 'kitchen'::app_role))
WITH CHECK (has_role(auth.uid(), 'kitchen'::app_role));

CREATE POLICY "Call center can view custom orders"
ON public.custom_order_details AS RESTRICTIVE
FOR SELECT USING (has_role(auth.uid(), 'call_center'::app_role));

-- Create function to create custom order (Customer Support only)
CREATE OR REPLACE FUNCTION public.create_custom_order(
  _customer_name text,
  _customer_phone text,
  _customer_address text,
  _branch_id uuid,
  _pickup_date date,
  _pickup_time time,
  _product_type text,
  _occasion text DEFAULT NULL,
  _number_of_people integer DEFAULT NULL,
  _flavor text DEFAULT NULL,
  _filling text DEFAULT NULL,
  _sugar_level text DEFAULT NULL,
  _design_description text DEFAULT NULL,
  _writing_text text DEFAULT NULL,
  _reference_image_url text DEFAULT NULL,
  _reference_order_id uuid DEFAULT NULL,
  _notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _customer_id uuid;
  _order_id uuid;
  _order_number text;
BEGIN
  -- Check permission
  IF NOT has_role(_user_id, 'customer_support'::app_role) AND NOT is_admin(_user_id) THEN
    RAISE EXCEPTION 'Access denied: Customer Support role required';
  END IF;

  -- Upsert customer
  INSERT INTO customers (name, phone, address)
  VALUES (_customer_name, _customer_phone, _customer_address)
  ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    address = COALESCE(EXCLUDED.address, customers.address)
  RETURNING id INTO _customer_id;

  -- Generate order number
  _order_number := 'CUST-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');

  -- Create order with custom_pending_review status
  INSERT INTO orders (
    order_number,
    customer_id,
    branch_id,
    delivery_date,
    delivery_time,
    notes,
    status,
    order_type,
    created_by,
    total_amount
  ) VALUES (
    _order_number,
    _customer_id,
    _branch_id,
    _pickup_date,
    _pickup_time,
    _notes,
    'custom_pending_review'::order_status,
    'custom',
    _user_id,
    0 -- Price set by chef
  )
  RETURNING id INTO _order_id;

  -- Create custom order details
  INSERT INTO custom_order_details (
    order_id,
    product_type,
    occasion,
    number_of_people,
    flavor,
    filling,
    sugar_level,
    design_description,
    writing_text,
    reference_image_url,
    reference_order_id
  ) VALUES (
    _order_id,
    _product_type,
    _occasion,
    _number_of_people,
    _flavor,
    _filling,
    _sugar_level,
    _design_description,
    _writing_text,
    _reference_image_url,
    _reference_order_id
  );

  -- Log the creation
  INSERT INTO order_logs (order_id, action, description, performed_by)
  VALUES (_order_id, 'CUSTOM_ORDER_CREATED', 'Custom order created by customer support', _user_id);

  RETURN _order_id;
END;
$$;

-- Chef review function (Kitchen only)
CREATE OR REPLACE FUNCTION public.chef_review_custom_order(
  _order_id uuid,
  _feasibility text,
  _preparation_time text,
  _proposed_price numeric,
  _notes text DEFAULT NULL,
  _rejection_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _current_status order_status;
  _new_status order_status;
BEGIN
  -- Check permission
  IF NOT has_role(_user_id, 'kitchen'::app_role) AND NOT is_admin(_user_id) THEN
    RAISE EXCEPTION 'Access denied: Kitchen role required';
  END IF;

  -- Get current status
  SELECT status INTO _current_status FROM orders WHERE id = _order_id;
  
  IF _current_status != 'custom_pending_review' THEN
    RAISE EXCEPTION 'Order is not pending review';
  END IF;

  -- Determine new status
  IF _feasibility = 'not_feasible' THEN
    _new_status := 'custom_rejected';
  ELSE
    _new_status := 'custom_chef_approved';
  END IF;

  -- Update custom order details
  UPDATE custom_order_details SET
    chef_reviewed_by = _user_id,
    chef_reviewed_at = now(),
    chef_feasibility = _feasibility,
    chef_preparation_time = _preparation_time,
    chef_proposed_price = _proposed_price,
    chef_notes = _notes,
    chef_rejection_reason = _rejection_reason,
    updated_at = now()
  WHERE order_id = _order_id;

  -- Update order status and price
  UPDATE orders SET
    status = _new_status,
    total_amount = COALESCE(_proposed_price, 0),
    status_changed_at = now(),
    status_changed_by = _user_id,
    status_changed_role = 'kitchen'
  WHERE id = _order_id;

  -- Log the action
  INSERT INTO order_logs (order_id, action, description, performed_by)
  VALUES (
    _order_id,
    CASE WHEN _new_status = 'custom_rejected' THEN 'CUSTOM_ORDER_REJECTED' ELSE 'CUSTOM_ORDER_APPROVED' END,
    CASE WHEN _new_status = 'custom_rejected' 
      THEN 'Custom order rejected: ' || COALESCE(_rejection_reason, 'No reason provided')
      ELSE 'Custom order approved. Price: ' || _proposed_price || ', Prep time: ' || _preparation_time
    END,
    _user_id
  );

  RETURN json_build_object(
    'success', true,
    'new_status', _new_status::text
  );
END;
$$;

-- Customer confirmation function (Call Center / Admin only - NOT customer support)
CREATE OR REPLACE FUNCTION public.confirm_custom_order_price(
  _order_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _current_status order_status;
BEGIN
  -- Check permission - Customer support CANNOT confirm
  IF has_role(_user_id, 'customer_support'::app_role) AND NOT is_admin(_user_id) THEN
    RAISE EXCEPTION 'Access denied: Customer Support cannot confirm orders';
  END IF;
  
  IF NOT has_role(_user_id, 'call_center'::app_role) AND NOT is_admin(_user_id) THEN
    RAISE EXCEPTION 'Access denied: Call Center or Admin role required';
  END IF;

  -- Get current status
  SELECT status INTO _current_status FROM orders WHERE id = _order_id;
  
  IF _current_status != 'custom_chef_approved' THEN
    RAISE EXCEPTION 'Order must be chef-approved before confirming';
  END IF;

  -- Update custom order details
  UPDATE custom_order_details SET
    customer_confirmed_price = true,
    customer_confirmed_at = now(),
    confirmed_by = _user_id,
    updated_at = now()
  WHERE order_id = _order_id;

  -- Update order status to awaiting_payment
  UPDATE orders SET
    status = 'awaiting_payment',
    status_changed_at = now(),
    status_changed_by = _user_id,
    status_changed_role = 'call_center'
  WHERE id = _order_id;

  -- Log the action
  INSERT INTO order_logs (order_id, action, description, performed_by)
  VALUES (_order_id, 'CUSTOM_ORDER_PRICE_CONFIRMED', 'Customer confirmed the proposed price', _user_id);

  RETURN json_build_object('success', true);
END;
$$;

-- Function to get custom orders for kitchen review
CREATE OR REPLACE FUNCTION public.get_custom_orders_for_review()
RETURNS TABLE (
  id uuid,
  order_number text,
  customer_name text,
  branch_name text,
  pickup_date date,
  pickup_time time,
  product_type text,
  occasion text,
  number_of_people integer,
  flavor text,
  filling text,
  sugar_level text,
  design_description text,
  writing_text text,
  reference_image_url text,
  notes text,
  created_at timestamptz,
  status order_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'kitchen'::app_role) AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    get_customer_name_only(o.customer_id) as customer_name,
    b.name as branch_name,
    o.delivery_date as pickup_date,
    o.delivery_time as pickup_time,
    cod.product_type,
    cod.occasion,
    cod.number_of_people,
    cod.flavor,
    cod.filling,
    cod.sugar_level,
    cod.design_description,
    cod.writing_text,
    cod.reference_image_url,
    o.notes,
    o.created_at,
    o.status
  FROM orders o
  JOIN custom_order_details cod ON cod.order_id = o.id
  LEFT JOIN branches b ON b.id = o.branch_id
  WHERE o.status = 'custom_pending_review'
  ORDER BY o.created_at ASC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_custom_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.chef_review_custom_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_custom_order_price TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_custom_orders_for_review TO authenticated;