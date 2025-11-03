# 🚀 Supabase Setup Guide

Follow these steps to connect your app to real Supabase data:

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up/Login (GitHub recommended)
4. Create new project:
   - **Name:** `norwegian-restaurant-deals`
   - **Password:** Generate strong password (save it!)
   - **Region:** `eu-west-1` (closest to Norway)
5. Wait 2-3 minutes for setup

## 2. Get Your Credentials

In your Supabase dashboard:
1. Go to **Settings → API**
2. Copy these values:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJ...` (long string)

## 3. Configure Environment

Create `.env.local` file in project root:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**⚠️ Replace with your actual values from step 2!**

## 4. Set Up Database

### A. Create Tables & Policies
1. In Supabase dashboard → **SQL Editor**
2. Copy entire contents of `supabase-schema.sql`
3. Paste and click **"RUN"**
4. Should see: ✅ Success. No rows returned

### B. Add Sample Data
1. In **SQL Editor** again
2. Copy entire contents of `supabase-seed-data.sql` 
3. Paste and click **"RUN"**
4. Should see: ✅ Success with row counts

## 5. Test Connection

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Open app** → should now show:
   - ❌ Demo banner gone
   - ✅ Real restaurant data
   - ✅ Working authentication
   - ✅ Persistent favorites

## 6. Verify Setup

Test these features:
- [ ] **Sign up** with email/password
- [ ] **Login/logout** works
- [ ] **Favorite restaurants** (hearts work)
- [ ] **View favorites page** (shows saved restaurants)
- [ ] **Claim deals** (modal works)
- [ ] **View claims history**

## 🎉 You're Done!

Your app is now connected to real Supabase data and ready for production!

## 🆘 Troubleshooting

**App still shows demo banner?**
- Check `.env.local` file exists and has correct values
- Restart dev server: `npm run dev`

**Database errors?**
- Verify both SQL files ran successfully
- Check Tables tab in Supabase for created tables

**Auth not working?**
- Check Environment Variables in Supabase Settings
- Verify Site URL is set to `http://localhost:5173`































