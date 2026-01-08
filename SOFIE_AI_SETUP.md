# Sofie AI Setup Guide

This guide explains how to set up and deploy the Sofie AI Edge Function.

## Prerequisites

1. **Supabase CLI installed** (already done via `npx supabase`)
2. **Supabase project** (you already have one)
3. **OpenAI API key** (optional - placeholder is used for now)

## Step 1: Initialize Supabase (if not done)

If you haven't initialized Supabase in this project:

```bash
npx supabase init
```

This creates the `supabase/` folder structure.

## Step 2: Link to Your Supabase Project

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

To find your project ref:
1. Go to your Supabase dashboard
2. Go to Settings → General
3. Copy the "Reference ID" (looks like: `abcdefghijklmnop`)

## Step 3: Deploy the Edge Function

```bash
npx supabase functions deploy sofie-chat
```

This will:
- Upload the function to Supabase
- Set up the necessary environment variables
- Make it available at: `https://YOUR_PROJECT.supabase.co/functions/v1/sofie-chat`

## Step 4: Set Environment Variables (Optional)

If you want to use OpenAI later:

1. Go to Supabase Dashboard
2. Navigate to: **Project Settings → Edge Functions → Secrets**
3. Add: `OPENAI_API_KEY` = `your-openai-api-key`

## Step 5: Test the Function

The function is now ready to use! The frontend (`src/routes/ai.tsx`) will automatically call it when users chat with Sofie.

## How It Works

1. **User sends message** → Frontend calls Edge Function
2. **Edge Function:**
   - Extracts intent (food type, city, dietary requirements)
   - Searches deals/restaurants in database
   - Filters by location (geolocation or city name)
   - Generates AI response (placeholder for now)
3. **Response sent back** → Displayed in chat

## Current Features

✅ Intent extraction (keywords: hamburger, pizza, oslo, bergen, etc.)
✅ Location-based search (geolocation or city name)
✅ Deal and restaurant search
✅ Dietary filter (vegetarian, vegan, gluten-free)
✅ Distance calculation and sorting

## Future Enhancements (When OpenAI Key Added)

- Replace placeholder with OpenAI GPT-3.5/GPT-4
- Better natural language understanding
- Context-aware conversations
- More sophisticated intent extraction

## Troubleshooting

**Function not found?**
- Make sure you've deployed: `npx supabase functions deploy sofie-chat`
- Check that you're linked to the correct project

**CORS errors?**
- Edge Functions have CORS headers built-in
- If issues persist, check Supabase project settings

**Database errors?**
- Make sure RLS policies allow public read access to deals/restaurants
- Check that tables exist and have data

## Testing Locally (Optional)

You can test the function locally:

```bash
npx supabase functions serve sofie-chat
```

Then test with:
```bash
curl -X POST http://localhost:54321/functions/v1/sofie-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Finn hamburger i Oslo"}'
```
