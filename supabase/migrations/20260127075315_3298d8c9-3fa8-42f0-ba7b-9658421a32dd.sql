-- Create ENUM for order status
CREATE TYPE public.order_status AS ENUM (
  'pending_approval',
  'awaiting_payment', 
  'paid',
  'preparing',
  'ready_to_ship',
  'in_transit',
  'ready_for_pickup',
  'completed'
);

-- Create ENUM for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'call_center', 'kitchen', 'branch');

-- Branches table
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  status public.order_status DEFAULT 'pending_approval' NOT NULL,
  total_amount DECIMAL(10,2) DEFAULT 0 NOT NULL,
  delivery_date DATE,
  delivery_time TIME,
  notes TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  payment_link TEXT,
  tracking_code TEXT UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Order logs table (audit trail)
CREATE TABLE public.order_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- User branch assignment table
CREATE TABLE public.user_branch_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, branch_id)
);

-- Profiles table for user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_branch_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper function: Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Helper function: Get user's branch ID
CREATE OR REPLACE FUNCTION public.get_user_branch_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM public.user_branch_assignments
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger function for auto-creating profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger function for order logging
CREATE OR REPLACE FUNCTION public.log_order_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_logs (order_id, action, description, performed_by)
    VALUES (NEW.id, 'created', 'تم إنشاء الطلب', NEW.created_by);
  ELSIF TG_OP = 'UPDATE' AND OLD.status <> NEW.status THEN
    INSERT INTO public.order_logs (order_id, action, description, performed_by)
    VALUES (NEW.id, 'status_changed', 'تغيير الحالة من ' || OLD.status || ' إلى ' || NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_change
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_change();

-- Generate tracking code function
CREATE OR REPLACE FUNCTION public.generate_tracking_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_code IS NULL THEN
    NEW.tracking_code = 'PK' || UPPER(SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tracking_code
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_code();

-- Generate order number function
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- RLS Policies for branches
CREATE POLICY "Authenticated users can view branches"
  ON public.branches FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage branches"
  ON public.branches FOR ALL
  TO authenticated USING (public.is_admin(auth.uid()));

-- RLS Policies for products
CREATE POLICY "Authenticated users can view active products"
  ON public.products FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  TO authenticated USING (public.is_admin(auth.uid()));

-- RLS Policies for customers
CREATE POLICY "Authenticated users can view customers"
  ON public.customers FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Call center and admins can create customers"
  ON public.customers FOR INSERT
  TO authenticated WITH CHECK (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')
  );

CREATE POLICY "Admins can update customers"
  ON public.customers FOR UPDATE
  TO authenticated USING (public.is_admin(auth.uid()));

-- RLS Policies for orders
CREATE POLICY "Users can view orders based on role"
  ON public.orders FOR SELECT
  TO authenticated USING (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'call_center') OR
    public.has_role(auth.uid(), 'kitchen') OR
    (public.has_role(auth.uid(), 'branch') AND branch_id = public.get_user_branch_id(auth.uid()))
  );

CREATE POLICY "Call center and admins can create orders"
  ON public.orders FOR INSERT
  TO authenticated WITH CHECK (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')
  );

CREATE POLICY "Users can update orders based on role"
  ON public.orders FOR UPDATE
  TO authenticated USING (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'call_center') OR
    public.has_role(auth.uid(), 'kitchen') OR
    (public.has_role(auth.uid(), 'branch') AND branch_id = public.get_user_branch_id(auth.uid()))
  );

CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  TO authenticated USING (public.is_admin(auth.uid()));

-- RLS Policies for order_items
CREATE POLICY "Users can view order items"
  ON public.order_items FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Call center and admins can manage order items"
  ON public.order_items FOR ALL
  TO authenticated USING (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'call_center')
  );

-- RLS Policies for order_logs
CREATE POLICY "Authenticated users can view order logs"
  ON public.order_logs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "System creates order logs"
  ON public.order_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- RLS Policies for user_roles (admin only)
CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL
  TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  TO authenticated USING (user_id = auth.uid());

-- RLS Policies for user_branch_assignments (admin only)
CREATE POLICY "Admins can manage branch assignments"
  ON public.user_branch_assignments FOR ALL
  TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own assignment"
  ON public.user_branch_assignments FOR SELECT
  TO authenticated USING (user_id = auth.uid());

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated USING (id = auth.uid());

CREATE POLICY "Profiles are created automatically"
  ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

-- Insert default branches
INSERT INTO public.branches (name, address, phone) VALUES
  ('الفرع الرئيسي', 'شارع الملك فهد، الرياض', '0501234567'),
  ('فرع جدة', 'شارع التحلية، جدة', '0507654321'),
  ('فرع الدمام', 'شارع الخليج، الدمام', '0509876543');

-- Insert default products
INSERT INTO public.products (name, description, price, category) VALUES
  ('كيكة الفراولة', 'كيكة طبقات بالفراولة الطازجة', 150.00, 'كيك'),
  ('كيكة الشوكولاتة', 'كيكة غنية بالشوكولاتة البلجيكية', 180.00, 'كيك'),
  ('تشيز كيك', 'تشيز كيك كلاسيكي', 120.00, 'كيك'),
  ('كب كيك فانيلا', 'كب كيك بالفانيلا (12 قطعة)', 80.00, 'كب كيك'),
  ('كب كيك ريد فلفت', 'كب كيك ريد فلفت (12 قطعة)', 90.00, 'كب كيك'),
  ('بسبوسة', 'بسبوسة تقليدية بالقطر', 60.00, 'حلويات شرقية'),
  ('كنافة نابلسية', 'كنافة بالجبن', 100.00, 'حلويات شرقية'),
  ('بقلاوة مشكلة', 'تشكيلة بقلاوة (500 جرام)', 75.00, 'حلويات شرقية');