# Sofie Chat Edge Function

This Edge Function handles AI-powered chat for Sofie, helping users find deals and restaurants.

## Setup

1. **Deploy the function:**
   ```bash
   supabase functions deploy sofie-chat
   ```

2. **Set environment variables in Supabase Dashboard:**
   - Go to Project Settings → Edge Functions → Environment Variables
   - The function automatically uses `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the project

3. **For OpenAI integration (when API key is available):**
   - Add `OPENAI_API_KEY` to environment variables
   - Update the `generateAIResponse` function to use OpenAI API

## Usage

```typescript
const { data, error } = await supabase.functions.invoke('sofie-chat', {
  body: {
    message: 'Finn hamburger i Oslo',
    userId: 'user-id',
    location: { lat: 59.9139, lng: 10.7522 },
    city: 'Oslo',
  }
})
```

## Features

- Intent extraction (food type, city, dietary requirements)
- Location-based search (geolocation or city name)
- Deal and restaurant search
- AI response generation (placeholder - ready for OpenAI integration)
