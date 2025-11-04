# Quick Setup Guide

## 1. Install Dependencies
```bash
npm install -g pnpm
pnpm install
```

## 2. Environment Setup
Copy `env.example` to `.env.local` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Database Setup
Run the SQL script from README.md in your Supabase SQL Editor.

## 4. Start Development
```bash
pnpm dev
```

## 5. Build for Production
```bash
pnpm build
```

## PWA Icons
Replace the placeholder files in `public/` with actual PNG icons:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)

## Next Steps
1. Customize the app colors in `src/styles/tokens.css`
2. Add your restaurant data via Supabase dashboard
3. Test the claim flow with real data
4. Deploy to your preferred hosting platform

































