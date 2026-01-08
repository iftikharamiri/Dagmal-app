# Hvordan sjekke OpenAI logs i Supabase

## Se logs i Supabase Dashboard

1. Gå til [supabase.com/dashboard](https://supabase.com/dashboard)
2. Velg ditt prosjekt
3. Gå til **Edge Functions** i venstre meny
4. Klikk på **sofie-chat** funksjonen
5. Gå til **Logs** fanen
6. Her kan du se alle log-meldingene fra Edge Function

## Hva du skal se etter

### Hvis OpenAI fungerer:
```
Checking OpenAI API key... hasApiKey: true
Calling OpenAI API...
OpenAI API response status: 200
✅ Successfully got OpenAI response
```

### Hvis OpenAI IKKE fungerer:
```
Checking OpenAI API key... hasApiKey: false
No OpenAI API key found, using placeholder response
```

ELLER

```
OpenAI API response status: 401
OpenAI API returned error: Invalid API key
```

## Sjekk at API key er riktig satt

1. Gå til **Project Settings** → **Edge Functions** → **Secrets**
2. Sjekk at `OPENAI_API_KEY` finnes
3. Sjekk at den starter med `sk-`
4. Hvis ikke, legg den til:
   - Klikk **Add new secret**
   - Name: `OPENAI_API_KEY`
   - Value: `sk-...` (din OpenAI API key)

## Test lokalt (valgfritt)

Du kan også teste lokalt:

```bash
# Serve function locally
supabase functions serve sofie-chat --env-file .env.local

# I en annen terminal, test funksjonen
curl -i --location --request POST 'http://localhost:54321/functions/v1/sofie-chat' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --data '{
    "message": "Finn hamburger i Oslo",
    "location": { "lat": 59.9139, "lng": 10.7522 },
    "city": "Oslo"
  }'
```

## Fikser hvis det ikke fungerer

Hvis du ser `hasApiKey: false` i logs:
1. Sjekk at du har lagt til `OPENAI_API_KEY` i Supabase Secrets
2. Redeploy funksjonen: `npx supabase functions deploy sofie-chat`
3. Test igjen

Hvis du ser `401 Unauthorized`:
1. Sjekk at API key er riktig (starter med `sk-`)
2. Sjekk at API key ikke er utløpt
3. Generer en ny API key fra OpenAI Dashboard

Hvis du fortsatt får placeholder-svar:
1. Sjekk logs i Supabase Dashboard
2. Se etter feilmeldinger
3. Sjekk at funksjonen faktisk kalles (se i Network tab i browser DevTools)
