# Quick Deploy Guide for Sofie AI

## One-Time Setup

1. **Link to your Supabase project:**
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```
   Find your project ref in Supabase Dashboard → Settings → General → Reference ID

2. **Deploy the function:**
   ```bash
   npx supabase functions deploy sofie-chat
   ```

That's it! The function is now live and ready to use.

## What Happens Next

- Users can now chat with Sofie on the AI page
- Sofie will search for deals/restaurants based on their queries
- Location is automatically used (geolocation or city name in message)

## Adding OpenAI (Later)

When you get an OpenAI API key:

1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Add: `OPENAI_API_KEY` = `sk-...`
3. Update `supabase/functions/sofie-chat/index.ts`:
   - Uncomment the OpenAI code
   - Replace the placeholder `generateAIResponse` function

## Test It

1. Go to `/ai` page in your app
2. Type: "Finn hamburger i Oslo"
3. Sofie should respond with deals!
