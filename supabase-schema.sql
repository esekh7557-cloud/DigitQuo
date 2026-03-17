-- ============================================================================
-- PROFILES TABLE - User info (customers + admins)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'business', 'professional')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PROJECTS TABLE - Websites created by users
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  domain_name TEXT UNIQUE,
  template_id TEXT DEFAULT 'basic',
  site_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COUPONS TABLE - Discount codes
-- ============================================================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_code TEXT UNIQUE NOT NULL,
  discount_percentage DECIMAL(5, 2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  max_uses INT DEFAULT NULL,
  current_uses INT DEFAULT 0,
  expiry_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ORDERS TABLE - Transaction log
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  coupon_id UUID REFERENCES coupons(id),
  amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Enable RLS on all tables
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES RLS POLICIES
-- ============================================================================
-- Admins can see all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Users can view only their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only admins can insert new profiles
CREATE POLICY "Admins can create profiles" ON profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Only admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- ============================================================================
-- PROJECTS RLS POLICIES
-- ============================================================================
-- Admins can view all projects
CREATE POLICY "Admins can view all projects" ON projects
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Users can view only their own projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create projects
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own projects
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own projects
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- COUPONS RLS POLICIES
-- ============================================================================
-- Everyone can view active coupons (for validation at checkout)
CREATE POLICY "Anyone can view active coupons" ON coupons
  FOR SELECT
  USING (is_active = true);

-- Admins can view all coupons (including inactive)
CREATE POLICY "Admins can view all coupons" ON coupons
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Only admins can create coupons
CREATE POLICY "Admins can create coupons" ON coupons
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Only admins can update coupons
CREATE POLICY "Admins can update coupons" ON coupons
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Only admins can delete coupons
CREATE POLICY "Admins can delete coupons" ON coupons
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- ============================================================================
-- ORDERS RLS POLICIES
-- ============================================================================
-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Users can view only their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (backend) can create orders
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can update order status
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================
-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER profiles_update_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER projects_update_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER coupons_update_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER orders_update_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
