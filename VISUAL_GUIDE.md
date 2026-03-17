# 🎨 Admin Panel - Visual Interface Guide

## What Admin Users See

### Login & Verification
```
┌─────────────────────────────────────┐
│                                     │
│   DigitQuote                        │
│   Admin Control Panel               │
│                                     │
│   Email: [admin@digitquote.com]     │
│   Password: [••••••••••]            │
│                                     │
│   [LOGIN]                           │
│                                     │
└─────────────────────────────────────┘
        ↓
    AUTHENTICATION CHECK
   "Verifying credentials..."
        ↓
[✓] Is logged in?
[✓] Profile exists?
[✓] role == 'admin'?
        ↓
   Admin Panel Loads
```

---

## Main Admin Panel Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  Left Sidebar          │        Main Content Area                   │
│  (260px wide)          │                                            │
│                        │                                            │
│  DigitQuote            │  [🔍 Search...] [🔔 0] [🌙]               │
│  Admin                 │                                            │
│                        │  ╔════════════════════════════════════╗   │
│  Overview              │  ║ Dashboard                          ║   │
│  └─ Dashboard ✓        │  ║                                    ║   │
│                        │  ║  ┌──────────┬──────────┐           ║   │
│  Management            │  ║  │ Revenue  │ Users    │           ║   │
│  ├─ User Management    │  ║  │ ₹xxxxxx  │ xxx      │           ║   │
│  └─ Project Manager    │  ║  └──────────┴──────────┘           ║   │
│                        │  ║                                    ║   │
│  Growth                │  ║  ┌──────────┬──────────┐           ║   │
│  ├─ Coupons            │  ║  │ Sites    │ Health   │           ║   │
│  └─ Order History      │  ║  │ xxx      │ 98%      │           ║   │
│                        │  ║  └──────────┴──────────┘           ║   │
│  Settings              │  ║                                    ║   │
│  └─ Global Config      │  ║  [Revenue Chart]  [Recent Orders]  ║   │
│                        │  ║                                    ║   │
│  ┌────────────────────┐│  ╚════════════════════════════════════╝   │
│  │ 👤 Admin User      ││                                            │
│  │ admin@example.com  ││                                            │
│  └────────────────────┘│                                            │
│  [🚪 Logout]           │                                            │
│                        │                                            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## User Management Section

```
┌─────────────────────────────────────────────────────────────┐
│ User Management                          [+ Add New User]    │
│                                                              │
│ [🔍 Search...] [All Roles ▼] [All Status ▼]                │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Name       │ Email          │ Role     │ Plan   │ Status ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ John Doe   │ john@ex.com    │ Customer │ Basic  │ Active ││
│ │ Jane Smith │ jane@ex.com    │ Customer │ Pro    │ Active ││
│ │ Frau Mann  │ frau@ex.com    │ Customer │ Free   │ Inact. ││
│ │                                              [Suspend] ││
│ │ Mike Jones │ mike@ex.com    │ Admin    │ Prof.  │ Active ││
│ │                                              [Suspend] ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Showing 1-10 of 247 users                  [< 1 2 3 >]      │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Manager Section

```
┌─────────────────────────────────────────────────────────────┐
│ Project Manager                       [+ Create Project]    │
│                                                              │
│ [🔍 Search...] [All Templates ▼]                            │
│                                                              │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│ │My Awesome    │  │Tech Startup  │  │Shop Store    │        │
│ │Site          │  │Platform      │  │Portal        │        │
│ │              │  │              │  │              │        │
│ │Owner:        │  │Owner:        │  │Owner:        │        │
│ │john@ex.com   │  │jane@ex.com   │  │mike@ex.com   │        │
│ │              │  │              │  │              │        │
│ │Domain:       │  │Domain:       │  │Domain:       │        │
│ │mysite.com    │  │techstartup   │  │myshop.store  │        │
│ │              │  │.co           │  │              │        │
│ │Template:     │  │Template:     │  │Template:     │        │
│ │Professional  │  │Business      │  │Basic         │        │
│ │              │  │              │  │              │        │
│ │[Active]      │  │[Active]      │  │[Inactive]    │        │
│ └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                              │
│ ...more projects...                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Coupon Management Section

```
┌──────────────────────────────────────────────────────────────┐
│ Coupon Management                    [+ New Coupon Code]     │
│                                                               │
│ [🔍 Search codes...] [All Status ▼]                          │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │Code      │ Discount │ Usage    │ Expiry   │ Status      │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │WELCOME25 │ 25%      │ 47/100   │ 2025-04-17 │ Active  │ │
│ │          │          │          │          │ [Delete] │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │SUMMER30  │ 30%      │ 120/∞    │ 2025-06-17 │ Active  │ │
│ │          │          │          │          │ [Delete] │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │OLDCODE10 │ 10%      │ 1000/1000│ 2024-12-31 │ Expired │ │
│ │          │          │          │          │ [Delete] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Showing 1-10 of 47 coupons                [< 1 2 3 >]        │
└──────────────────────────────────────────────────────────────┘

Create Coupon Modal:
┌────────────────────────────────────┐
│ Create New Coupon             [x]  │
├────────────────────────────────────┤
│                                    │
│ Coupon Code:  [SUMMER25       ]    │
│                                    │
│ Discount %:   [25            ]     │
│                                    │
│ Max Uses:     [100           ]     │
│                                    │
│ Expiry Date:  [2025-06-17    ]     │
│                                    │
│             [Cancel] [Create Coupon]│
└────────────────────────────────────┘
```

---

## Order History Section

```
┌──────────────────────────────────────────────────────────────┐
│ Order History                          [📥 Export CSV]       │
│                                                               │
│ [🔍 Search by user/ID...] [All Status ▼]                     │
│                                                               │
│ ┌───────────────────────────────────────────────────────────┐│
│ │Order ID  │ User       │ Amount │ Final  │ Status │ Date  ││
│ ├───────────────────────────────────────────────────────────┤│
│ │12a34b5c  │ john@ex.com│ ₹12999 │ ₹9750  │ Comp.  │ 3/15 ││
│ │          │            │        │        │ [View] │      ││
│ ├───────────────────────────────────────────────────────────┤│
│ │89d23e4f  │ jane@ex.com│ ₹15999 │ ₹11999 │ Pend.  │ 3/16 ││
│ │          │            │        │        │ [View] │      ││
│ ├───────────────────────────────────────────────────────────┤│
│ │20x91g3h  │ mike@ex.com│ ₹17999 │ ₹17999 │ Failed │ 3/16 ││
│ │          │            │        │        │ [View] │      ││
│ └───────────────────────────────────────────────────────────┘│
│                                                               │
│ Showing 1-50 of 1,247 orders            [< 1 2 3 ... >]      │
└──────────────────────────────────────────────────────────────┘
```

---

## Global Configuration Section

```
┌──────────────────────────────────────────────────────────────┐
│ Global Configuration                   [💾 Save Changes]     │
│                                                               │
│ ┌──────────────────┐  ┌──────────────────┐                  │
│ │ API Keys         │  │ Email Settings   │                  │
│ ├──────────────────┤  ├──────────────────┤                  │
│ │                  │  │                  │                  │
│ │Supabase URL:     │  │SMTP Server:      │                  │
│ │[Read-only]       │  │[smtp.gmail.com]  │                  │
│ │                  │  │                  │                  │
│ │Stripe Key:       │  │From Email:       │                  │
│ │[sk_live_...] ****│  │[noreply@...]     │                  │
│ │                  │  │                  │                  │
│ │Stripe Pub Key:   │  │☑ Enable Emails   │                  │
│ │[pk_live_...]     │  │                  │                  │
│ │                  │  │                  │                  │
│ └──────────────────┘  └──────────────────┘                  │
│                                                               │
│ ┌──────────────────────────────────────┐                    │
│ │ Site-Wide Alerts                     │                    │
│ ├──────────────────────────────────────┤                    │
│ │                                      │                    │
│ │System Status:   [🟢 Online ▼]       │                    │
│ │                 [🟡 Maintenance]     │                    │
│ │                 [🔴 Offline]         │                    │
│ │                                      │                    │
│ │Alert Message:                        │                    │
│ │[System upgrade scheduled for...]     │                    │
│ │[                                  ]  │                    │
│ │                                      │                    │
│ └──────────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Color Scheme & Status Badges

### Status Colors
```
🟢 Active    - Green (#10b981) - User/project/coupon is active
🟡 Pending   - Amber (#f59e0b) - Order waiting for payment
🔴 Inactive  - Red (#ef4444) - User suspended/project offline
⚫ Failed    - Gray (#6b7280) - Order failed/error occurred
```

### Roles
```
[Admin]    - Red badge - Full system access
[Customer] - Blue badge - Limited to own data
```

### Plan Badges
```
Free        - Gray
Basic       - Blue
Business    - Purple
Professional - Gold
```

---

## Responsive Mobile View

### Mobile Layout (< 768px)
```
┌───────────────────────┐
│ ☰  │ 🔍  │ 🔔  │ 🌙 │
├───────────────────────┤
│                       │
│  Dashboard            │
│  ┌─────────────────┐  │
│  │ Revenue         │  │
│  │ ₹xxxxx          │  │
│  └─────────────────┘  │
│  ┌─────────────────┐  │
│  │ Users           │  │
│  │ xxx             │  │
│  └─────────────────┘  │
│  ...                  │
│                       │
├───────────────────────┤
│ ☰ Menu opens below    │
│ Overview              │
│ └─ Dashboard          │
│ Management            │
│ ├─ Users              │
│ └─ Projects           │
│ ...                   │
│                       │
│ [👤 Profile]          │
│ [Logout]              │
└───────────────────────┘
```

---

## Login Flow for Different Users

### Admin Try to Login
```
admin@example.com
password: ✓✓✓✓✓✓✓

[LOGIN]
  ↓
1. Auth check ✓
2. Profile check ✓
3. Role check: "admin" ✓
  ↓
FULL ADMIN PANEL
Dashboard + all features
```

### Regular Customer Try to Login
```
customer@example.com
password: ✓✓✓✓✓✓✓

[LOGIN]
  ↓
1. Auth check ✓
2. Profile check ✓
3. Role check: "customer" ✗
  ↓
ACCESS DENIED
"Admin privileges required"
Redirected to login.html
```

---

## Dashboard Analytics Cards

```
┌─────────────────────┐
│ 💰 Total Revenue    │
│                     │
│ ₹1,234,567          │
│ +12.5% this month   │
└─────────────────────┘

┌─────────────────────┐
│ 👥 Active Users     │
│                     │
│ 847                 │
│ +8.2% growth        │
└─────────────────────┘

┌─────────────────────┐
│ 🌐 Active Sites     │
│                     │
│ 453                 │
│ 0% change           │
└─────────────────────┘

┌─────────────────────┐
│ 💚 System Health    │
│                     │
│ 98%                 │
│ All systems normal   │
└─────────────────────┘
```

---

## Table of Contents Navigation

```
Overview
├─ Dashboard [📊] - View metrics
│
Management
├─ User Mgmt [👥] - Manage customers
├─ Projects [🌐] - Track websites
│
Growth
├─ Coupons [🎟️] - Create discount codes
├─ Orders [📦] - View transactions
│
Settings
└─ Config [⚙️] - API keys & alerts
```

---

## Data Entry Dialog Example

```
┌─────────────────────────────────┐
│ Add New User              [x]   │
├─────────────────────────────────┤
│                                 │
│ Full Name:                      │
│ [________________________]       │
│                                 │
│ Email:                          │
│ [________________________]       │
│                                 │
│ Role:                           │
│ [Admin        ▼]                │
│ [Customer    ]                  │
│                                 │
│ Plan:                           │
│ [Professional ▼]                │
│ [Free     ]                     │
│ [Basic    ]                     │
│ [Business ]                     │
│                                 │
│      [Cancel] [Create User]     │
└─────────────────────────────────┘
```

---

## Summary

This visual guide shows what admins will see when they access the admin panel. Each section is:

- ✅ **Easy to navigate** - Clear sections, obvious buttons
- ✅ **Data-rich** - Tables, cards, stats all at a glance
- ✅ **Action-focused** - Quick buttons for common tasks
- ✅ **Mobile-friendly** - Responsive on all devices
- ✅ **Professional** - Modern design, consistent styling

---

*Designs shown are representative and may vary slightly from actual implementation.*
