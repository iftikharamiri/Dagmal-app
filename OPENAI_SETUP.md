# OpenAI Setup for Sofie AI

## Steg 1: Få OpenAI API Key

1. Gå til [platform.openai.com](https://platform.openai.com)
2. Logg inn eller opprett konto
3. Gå til **API Keys** i menyen
4. Klikk **"Create new secret key"**
5. Gi den et navn (f.eks. "Sofie AI")
6. **Kopier API key** (den vises bare én gang! Ser ut som: `sk-...`)

## Steg 2: Legg til API Key i Supabase

1. Gå til [supabase.com/dashboard](https://supabase.com/dashboard)
2. Velg ditt prosjekt
3. Gå til **Project Settings** (⚙️) → **Edge Functions** → **Secrets**
4. Klikk **"Add new secret"**
5. **Name:** `OPENAI_API_KEY`
6. **Value:** Lim inn API key du kopierte (starter med `sk-`)
7. Klikk **"Save"**

## Steg 3: Redeploy Edge Function

Etter at du har lagt til API key, må du redeploye funksjonen:

```bash
npx supabase functions deploy sofie-chat
```

## Steg 4: Test

1. Gå til `/ai` siden i appen
2. Skriv: "Finn hamburger i Oslo"
3. Sofie skal nå gi et mye mer naturlig og engasjerende svar! 🎉

## Hvordan det fungerer

- **Med API key:** Sofie bruker OpenAI GPT-3.5 for naturlige, kontekstbevisste svar
- **Uten API key:** Sofie bruker placeholder-funksjonen (templat-baserte svar)

Funksjonen sjekker automatisk om API key finnes og velger riktig metode.

## Kostnad

OpenAI GPT-3.5-turbo koster ca.:
- **$0.0015 per 1000 input tokens**
- **$0.002 per 1000 output tokens**

Eksempel:
- 1 samtale = ~500 tokens = **$0.00075** (0.075 øre)
- 1000 samtaler = **~$0.75**

## Troubleshooting

**"OpenAI API error" i logs?**
- Sjekk at API key er riktig i Supabase Secrets
- Sjekk at du har kreditt på OpenAI-kontoen
- Sjekk logs: `npx supabase functions logs sofie-chat`

**Får fortsatt placeholder-svar?**
- Sjekk at du har redeployet funksjonen etter å ha lagt til API key
- Vent 1-2 minutter for at endringene skal propagere
