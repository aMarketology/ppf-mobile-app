# PPF Mobile App - Quick Start Checklist

## ✅ Setup Complete

- [x] Project initialized with Expo + TypeScript
- [x] Navigation configured (Expo Router)
- [x] All dependencies installed
- [x] Full folder structure created
- [x] Design system implemented
- [x] Authentication screens built
- [x] Main app screens built
- [x] Component library created
- [x] API layer implemented
- [x] State management configured
- [x] Development server running

## 🔧 Before You Can Use The App

### 1. Create Supabase Project (10 min)

1. Go to https://supabase.com
2. Sign up / Login
3. Click "New Project"
4. Name it "ppf-marketplace"
5. Choose region closest to you
6. Wait for project to be created

### 2. Set Up Database (5 min)

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the SQL from `ppf-mobile/README.md` (Database Setup section)
3. Run all CREATE TABLE statements
4. Enable Row Level Security policies

### 3. Get API Keys (2 min)

1. In Supabase: **Settings → API**
2. Copy:
   - Project URL
   - anon/public key

### 4. Configure Environment (1 min)

```bash
cd ppf-mobile
cp .env.example .env
```

Edit `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co  # From Supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...              # From Supabase
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx      # Skip for now
```

### 5. Add Test Data (Optional - 5 min)

In Supabase SQL Editor:

```sql
-- Insert a test company
INSERT INTO company_profiles (id, company_name, slug, description, city, state, verified, rating, review_count)
VALUES (
  uuid_generate_v4(),
  'AECOM',
  'aecom',
  'Global engineering and construction firm',
  'Dallas',
  'TX',
  true,
  4.8,
  203
);

-- Get the company ID
SELECT id FROM company_profiles WHERE slug = 'aecom';

-- Insert test products (replace company_id with actual ID)
INSERT INTO products (company_id, title, slug, description, price, category, active, featured)
VALUES (
  'YOUR_COMPANY_ID_HERE',
  'Structural Engineering Analysis',
  'structural-analysis',
  'Comprehensive structural analysis including load calculations and seismic analysis',
  1500000,  -- $15,000 in cents
  'civil',
  true,
  true
);
```

## 🚀 Launch the App

```bash
cd ppf-mobile
npx expo start
```

Then:
- Scan QR code with Expo Go app (iOS/Android)
- Press `i` for iOS simulator (Mac only)
- Press `a` for Android emulator

## 🧪 Test the Flow

1. **Sign Up**
   - Open app → Should see login screen
   - Tap "Sign Up"
   - Fill in details
   - Choose "Client" or "Engineer"
   - Submit
   - Check email for verification

2. **Login**
   - Enter credentials
   - Should redirect to Home tab

3. **Browse**
   - See categories grid
   - Scroll to see featured products (if you added test data)
   - Tap a product card → Goes to detail screen

4. **Profile**
   - Tap Profile tab
   - See your name, email
   - Tap "Sign Out"

## 📊 Current App State

**Working Now:**
- ✅ Sign up / Login / Logout
- ✅ Bottom tab navigation
- ✅ Home screen layout
- ✅ Product cards (if data exists)
- ✅ Profile screen
- ✅ Empty states for Messages/Orders

**Coming Next:**
- 🚧 Product detail screen (full)
- 🚧 Checkout flow
- 🚧 Stripe payments
- 🚧 Messaging detail
- 🚧 Order detail

## 🎯 Development Workflow

### Making Changes

1. Edit files in `app/`, `components/`, etc.
2. Save → Metro bundler auto-reloads
3. Shake device or press `r` to reload

### Debugging

- Press `j` in terminal → Opens debugger
- Use console.log() → Shows in terminal
- React Native Debugger for advanced debugging

### Adding Features

1. **New Screen**: Create file in `app/`
2. **New Component**: Create in `components/`
3. **New API**: Add to `lib/api.ts`
4. **New Hook**: Create in `hooks/`

## 🆘 Troubleshooting

**App won't start:**
```bash
npx expo start -c  # Clear cache
```

**Supabase errors:**
- Check .env variables
- Verify database tables exist
- Check RLS policies

**Can't see products:**
- Add test data to Supabase
- Check `company_profiles` and `products` tables
- Verify `active = true` on products

**TypeScript errors:**
```bash
npx tsc --noEmit  # Check for type errors
```

## 📞 Need Help?

- Check `ppf-mobile/README.md` for full docs
- Review `ppf-mobile-app.md` for architecture
- See `ppf-design.md` for UI specs

## 🎉 You're Ready!

The app is now running and ready for development. All the core infrastructure is in place:

- 📱 Navigation
- 🎨 Design System
- 🔐 Authentication
- 💾 Database Connection
- 📦 State Management
- 🎯 Clean Architecture

Start building features! 🚀
