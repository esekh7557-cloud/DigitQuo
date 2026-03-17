# 🎯 Admin Panel Implementation Guide

## Overview

This complete admin panel system provides:
- ✅ Role-based access control (Admin-only access)
- ✅ Complete Supabase schema with RLS policies
- ✅ Dashboard with key metrics
- ✅ User management system
- ✅ Project management interface
- ✅ Coupon/discount code management
- ✅ Order history tracking
- ✅ Global configuration settings

---

## 🔧 Setup Instructions

### Phase 1: Database Setup (Supabase)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com/
   - Select your project

2. **Execute SQL Schema**
   - Navigate to **SQL Editor**
   - Create a new query
   - Copy & paste the entire content from `supabase-schema.sql`
   - Run the query
   - Wait for all tables and RLS policies to be created

3. **Verify Tables Created**
   - Go to **Table Editor**
   - Confirm these tables exist:
     - `profiles`
     - `projects`
     - `coupons`
     - `orders`

### Phase 2: Create Admin User

1. **In Supabase Auth**
   - Go to **Auth** → **Users**
   - Click **Add user**
   - Create an admin account (e.g., `admin@digitquote.com`)

2. **In Profiles Table**
   - Go to **Table Editor** → **profiles**
   - Add a new row with:
     - `id`: (Copy the UUID of the admin user created above)
     - `email`: `admin@digitquote.com`
     - `full_name`: `Admin User`
     - `role`: **admin** ⭐ **IMPORTANT: Must be "admin"**
     - `subscription_plan`: `professional`
     - `is_active`: `true`

### Phase 3: Deploy Frontend Files

1. **Upload these files to your web server:**
   - `admin.html` - Admin panel interface
   - `admin-style.css` - Admin panel styling
   - `admin-script.js` - Admin panel functionality
   - `supabase-config.js` - Updated with admin functions
   - `supabase-schema.sql` - For reference (keep for future updates)

2. **Access the Admin Panel**
   - Direct URL: `https://your-domain.com/admin.html`
   - Login with your admin account
   - The system will verify your role before showing the panel

---

## 🔐 Security Architecture

### Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────┐
│         User Visits admin.html           │
└────────────────┬────────────────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │ Auth Check: Is logged in?│
    └────────┬─────────────────┘
             │ No ────────────────────┐
             │                        ▼
             │                  Redirect to login.html
             │ Yes
             ▼
    ┌──────────────────────────┐
    │ Get User Profile         │
    │ SELECT * FROM profiles   │
    │ WHERE id = auth.uid()    │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Check: role == 'admin'?  │
    └────┬─────────────────┬───┘
    Yes  │                 │  No
         ▼                 ▼
    Show Admin         Redirect to
    Control Panel      login.html
```

### Row Level Security (RLS) Policies

Each table has specific RLS policies:

| Table | Admin Access | Customer Access |
|-------|-------------|-----------------|
| `profiles` | View all, edit any | View own, edit own |
| `projects` | View all | View own, create/edit/delete own |
| `coupons` | Full CRUD | View active only |
| `orders` | View all, update status | View own |

**Example RLS Policy** (Active Coupons):
```sql
-- Everyone can see active coupons during checkout
CREATE POLICY "Anyone can view active coupons" ON coupons
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage coupons
CREATE POLICY "Admins can create coupons" ON coupons
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );
```

---

## 📊 Dashboard Features

### 1. Overview (Dashboard)
- **Total Revenue**: Sum of all completed orders
- **Active Users**: Count of users with `is_active = true`
- **Active Sites**: Count of projects with `is_active = true`
- **System Health**: 98% (placeholder)
- **Recent Orders**: Last 5 orders with user email and amount

### 2. User Management
- List all users (excluding self)
- Filter by: Name/Email, Role, Status
- Quick Actions:
  - **Suspend User**: Set `is_active = false`
  - **Login As**: (Can be implemented for testing)

### 3. Project Manager
- View all customer websites
- See project configuration (JSONB)
- Filter by: Project name, template type
- Track active/inactive status

### 4. Coupon Management
- Create discount codes
- Set percentage discount (1-100%)
- Set max usage limit (optional)
- Set expiry dates
- Track current usage vs. limit
- Delete expired/unused coupons

### 5. Order History
- Complete transaction log
- Filter by: User, Order ID, Status
- View: Amount, discount applied, final price
- Export to CSV
- Mark as completed/failed/refunded

### 6. Global Config
- Stripe API credentials
- SMTP email settings
- System status broadcast
- Site-wide alerts

---

## 📱 Navigation Structure

```
Admin Panel
├── 📊 Overview
│   └── Dashboard
├── 👥 Management
│   ├── User Management
│   └── Project Manager
├── 📈 Growth
│   ├── Coupons
│   └── Order History
└── ⚙️ Settings
    └── Global Config
```

Each nav item is:
- **Active state indicator** (bright border + color)
- **Icon-based** for quick visual recognition
- **Responsive** (mobile-friendly sidebar)

---

## 🚀 How to Use

### Adding a New Coupon

1. Click **"New Coupon Code"** button in top-right
2. Fill in the form:
   - **Code**: `SUMMER2025`
   - **Discount**: `25` (percentage)
   - **Max Uses**: `100` (leave blank for unlimited)
   - **Expiry**: Select date or leave empty
3. Click **"Create Coupon"**
4. Verify in the coupons table

### Suspending a User

1. Go to **User Management**
2. Find the user in the table
3. Click **"Suspend"** button in Actions column
4. Confirm the action
5. User's status changes to "Inactive"

### Viewing Order Details

1. Go to **Order History**
2. Click **"View"** on any order row
3. See complete transaction details (Coming soon)

### Exporting Orders

1. Go to **Order History**
2. Click **"Export CSV"** button
3. Download CSV file with allorders
4. Open in Excel/Google Sheets

---

## 🔌 Integration with Stripe (Next Step)

For **Coupon Validation at Checkout**:

1. Create Supabase Edge Function:
```typescript
// supabase/functions/validate-coupon/index.ts
export async function validateCoupon(couponCode: string) {
  const supabase = createClient();
  
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('coupon_code', couponCode.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !coupon) return { valid: false };
  
  // Check expiry
  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
    return { valid: false };
  }
  
  // Check usage
  if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
    return { valid: false };
  }
  
  return { 
    valid: true, 
    discountPercentage: coupon.discount_percentage,
    couponId: coupon.id 
  };
}
```

2. Call from checkout form:
```javascript
const result = await fetch('/api/validate-coupon', {
  method: 'POST',
  body: JSON.stringify({ code: couponCode })
});
```

---

## 🛡️ Security Checklist

- ✅ `service_role_key` never exposed in frontend
- ✅ RLS policies enforce row-level access
- ✅ Admin role verified before showing panel
- ✅ Sensitive API keys stored in Supabase Vault (config section)
- ✅ Session tokens auto-refresh
- ✅ Logout clears all session data

---

## 📝 Common Tasks

### Create a Test Customer Account

1. Go to login/signup page
2. Create account (auto-creates profile with `role='customer'`)
3. As admin, go to User Management
4. You'll see the new customer in the list

### Change a User's Subscription Plan

1. In User Management, find the user
2. (Admin panel will show edit button in next iteration)
3. Update `subscription_plan` in Supabase directly

### Mark an Order as Refunded

1. Go to Order History
2. Click **"View"** on the order
3. Change status to "Refunded" (Coming soon)

---

## 🆘 Troubleshooting

### "Access Denied: Admin privileges required"

**Problem**: User trying to access admin panel with non-admin role

**Solution**: 
1. Check `profiles.role` in Supabase
2. Update to `"admin"` if needed
3. Clear browser cache and reload

### Coupons not showing in list

**Problem**: Coupons created but not visible

**Solution**:
1. Verify RLS policies are active: Check **SQL Editor** for "Admins can view all coupons"
2. Reload the page
3. Check browser console for errors (F12)

### Users can see admin panel

**Problem**: Regular users bypassing the admin check

**Solution**:
1. Verify `admin-script.js` line ~30-40 has the role check
2. Confirm RLS is enabled on all tables (Enable via Table Settings)
3. Never use `SUPABASE_SERVICE_ROLE_KEY` in frontend

---

## 📊 Database Growth Tips

| Table | Expected Growth | Recommended Indexing |
|-------|-----------------|----------------------|
| `profiles` | Slow (1-10k/year) | `email` (unique) |
| `projects` | Moderate (100k+) | `user_id`, `created_at` |
| `coupons` | Slow (100-1k) | `coupon_code` (unique) |
| `orders` | Fast (1M+/year) | `user_id`, `status`, `created_at` |

**Archiving Old Orders**:
```sql
-- Archive orders older than 2 years
CREATE TABLE orders_archive AS
SELECT * FROM orders WHERE created_at < NOW() - INTERVAL '2 years';

DELETE FROM orders WHERE created_at < NOW() - INTERVAL '2 years';
```

---

## 🚦 Next Steps

1. ✅ **Now**: Database & admin panel ready
2. **Next**: Integrate Stripe payments with coupon validation
3. **Then**: Email notifications on user signup/order
4. **Finally**: Analytics dashboard with charts

---

## 📞 Support

For issues:
1. Check Supabase logs: Supabase Dashboard → Logs
2. Check browser console: F12 → Console tab
3. Verify RLS policies: SQL Editor → View policies
4. Check auth session: `supabase.auth.getSession()`

---

**Last Updated**: March 2025
**Admin Panel Version**: 1.0
