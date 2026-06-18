-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- PROFILES TABLE - User info (customers + admins)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  country TEXT,
  profile_photo TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  subscription_plan TEXT DEFAULT 'free' CHECK (
    subscription_plan IN ('free', 'basic', 'business', 'professional')
  ),
  is_active BOOLEAN DEFAULT true,
  suspension_reason TEXT,
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
  site_config JSONB DEFAULT '{}'::jsonb,
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
  discount_percentage DECIMAL(5, 2),
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (
    discount_type IN ('percentage', 'fixed')
  ),
  discount_value DECIMAL(10, 2),
  max_uses INT DEFAULT NULL,
  current_uses INT DEFAULT 0,
  expiry_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT coupons_discount_value_check CHECK (
    (
      discount_type = 'percentage'
      AND COALESCE(discount_value, discount_percentage) > 0
      AND COALESCE(discount_value, discount_percentage) <= 100
    )
    OR (
      discount_type = 'fixed'
      AND COALESCE(discount_value, 0) > 0
    )
  )
);

ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'percentage';

ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10, 2);

ALTER TABLE coupons
  ALTER COLUMN discount_percentage DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'coupons'
      AND constraint_name = 'coupons_discount_percentage_check'
  ) THEN
    ALTER TABLE coupons DROP CONSTRAINT coupons_discount_percentage_check;
  END IF;
END $$;

UPDATE coupons
SET discount_type = COALESCE(NULLIF(discount_type, ''), 'percentage'),
    discount_value = COALESCE(discount_value, discount_percentage)
WHERE discount_value IS NULL
   OR discount_type IS NULL
   OR discount_type = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'coupons'
      AND constraint_name = 'coupons_discount_type_check'
  ) THEN
    ALTER TABLE coupons
      ADD CONSTRAINT coupons_discount_type_check CHECK (discount_type IN ('percentage', 'fixed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'coupons'
      AND constraint_name = 'coupons_discount_value_check'
  ) THEN
    ALTER TABLE coupons
      ADD CONSTRAINT coupons_discount_value_check CHECK (
        (
          discount_type = 'percentage'
          AND COALESCE(discount_value, discount_percentage) > 0
          AND COALESCE(discount_value, discount_percentage) <= 100
        )
        OR (
          discount_type = 'fixed'
          AND COALESCE(discount_value, 0) > 0
        )
      );
  END IF;
END $$;

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
  payment_status TEXT DEFAULT 'unpaid' CHECK (
    payment_status IN ('paid', 'unpaid')
  ),
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'ongoing', 'completed', 'failed', 'refunded')
  ),
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- REVIEWS TABLE - Public testimonials submitted by customers
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) <= 280),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
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
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_active_created_at ON reviews(is_active, created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    country,
    profile_photo,
    role,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'country', NEW.raw_user_meta_data ->> 'address', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'profile_photo', ''),
    'customer',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
    country = COALESCE(NULLIF(EXCLUDED.country, ''), public.profiles.country),
    profile_photo = COALESCE(NULLIF(EXCLUDED.profile_photo, ''), public.profiles.profile_photo);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role access to profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

CREATE POLICY "Users can create their own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id OR is_admin());

CREATE POLICY "Service role access to profiles" ON profiles
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- PROJECTS RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Service role access to projects" ON projects;

CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Service role access to projects" ON projects
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- COUPONS RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
DROP POLICY IF EXISTS "Service role access to coupons" ON coupons;

CREATE POLICY "Anyone can view active coupons" ON coupons
  FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage coupons" ON coupons
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service role access to coupons" ON coupons
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- ORDERS RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Service role access to orders" ON orders;

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service role access to orders" ON orders
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- REVIEWS RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view active reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
DROP POLICY IF EXISTS "Service role access to reviews" ON reviews;

CREATE POLICY "Anyone can view active reviews" ON reviews
  FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Users can create own reviews" ON reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can manage reviews" ON reviews
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service role access to reviews" ON reviews
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS profiles_update_updated_at ON profiles;
CREATE TRIGGER profiles_update_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS projects_update_updated_at ON projects;
CREATE TRIGGER projects_update_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS coupons_update_updated_at ON coupons;
CREATE TRIGGER coupons_update_updated_at
BEFORE UPDATE ON coupons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS orders_update_updated_at ON orders;
CREATE TRIGGER orders_update_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS reviews_update_updated_at ON reviews;
CREATE TRIGGER reviews_update_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS auth_users_after_insert ON auth.users;
CREATE TRIGGER auth_users_after_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_new_user();

DROP TRIGGER IF EXISTS auth_users_after_update ON auth.users;
CREATE TRIGGER auth_users_after_update
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_new_user();

-- ============================================================================
-- MIGRATION HELPERS
-- ============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'address'
  ) THEN
    EXECUTE 'UPDATE public.profiles SET country = COALESCE(NULLIF(country, ''''), address) WHERE COALESCE(NULLIF(country, ''''), '''') = ''''';
  END IF;
END $$;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'inr';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_currency TEXT DEFAULT 'INR';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_currency TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_wallet_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_payment_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_payment_uri TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_amount_expected TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_amount_received TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_tx_hash TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_confirmations INT DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_confirmation_target INT DEFAULT 1;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
UPDATE orders SET payment_status = 'unpaid' WHERE payment_status IS NULL;
UPDATE orders SET payment_method = 'inr' WHERE payment_method IS NULL;
UPDATE orders SET payment_currency = 'INR' WHERE payment_currency IS NULL;
