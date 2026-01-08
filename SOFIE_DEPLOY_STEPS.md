# 🚀 Sofie AI - Step-by-Step Deploy Guide

## Steg 1: Finn din Supabase Project Reference ID

1. Gå til [supabase.com/dashboard](https://supabase.com/dashboard)
2. Logg inn og velg ditt prosjekt
3. Gå til **Settings** (⚙️) → **General**
4. Scroll ned til **Reference ID**
5. **Kopier Reference ID** (ser ut som: `abcdefghijklmnop` eller lignende)
6. **Skriv det ned** - du trenger det i neste steg

---

## Steg 2: Link prosjektet til Supabase CLI

Åpne terminal/PowerShell i prosjektmappen og kjør:

```bash
npx supabase link --project-ref DIN_PROJECT_REF_HER
```

**Eksempel:**
```bash
npx supabase link --project-ref nrutsewxzbtysbskaabd
```

Du blir spurt om:
- **Database password** - Dette er passordet du satte da du opprettet Supabase-prosjektet
  - Hvis du ikke husker det, kan du reset det i Supabase Dashboard → Settings → Database

Etter vellykket linking skal du se:
```
✅ Linked to project abcdefghijklmnop
```

---

## Steg 3: Deploy Edge Function

Kjør denne kommandoen:

```bash
npx supabase functions deploy sofie-chat
```

Dette kan ta 1-2 minutter. Du skal se noe som:
```
Deploying function sofie-chat...
✅ Function sofie-chat deployed successfully
```

---

## Steg 4: Test at det fungerer

1. **Start din app** (hvis den ikke kjører):
   ```bash
   npm run dev
   ```

2. **Gå til AI-siden:**
   - Åpne nettleseren
   - Gå til: `http://localhost:5173/ai` (eller din dev URL)

3. **Test Sofie:**
   - Skriv: `Finn hamburger i Oslo`
   - Trykk Enter eller klikk send-knappen
   - Sofie skal svare med relevante tilbud!

---

## Steg 5: Verifiser at alt fungerer

Test disse scenariene:

✅ **Test 1: Søk med mattype**
- Skriv: `Finn pizza`
- Sofie skal finne pizza-tilbud nær deg

✅ **Test 2: Søk med by**
- Skriv: `Finn sushi i Bergen`
- Sofie skal finne sushi-tilbud i Bergen (hvis de finnes)

✅ **Test 3: Søk med allergener**
- Skriv: `Finn vegetarisk mat`
- Sofie skal finne vegetariske tilbud

---

## 🐛 Hvis noe går galt

### Problem: "Project not found"
**Løsning:** Sjekk at project ref er riktig. Prøv å linke på nytt.

### Problem: "Database password incorrect"
**Løsning:** 
1. Gå til Supabase Dashboard → Settings → Database
2. Klikk "Reset database password"
3. Kopier det nye passordet
4. Prøv `npx supabase link` igjen

### Problem: "Function not found" i appen
**Løsning:**
1. Sjekk at deploy var vellykket
2. Vent 1-2 minutter (kan ta litt tid å propagere)
3. Refresh nettleseren
4. Sjekk browser console for feilmeldinger

### Problem: "CORS error"
**Løsning:** Edge Functions har CORS innebygd. Hvis du får CORS-feil, sjekk:
- At du har deployet funksjonen
- At du bruker riktig Supabase URL

---

## ✅ Når alt fungerer

Gratulerer! Sofie AI er nå live og fungerer. 

**Neste steg (valgfritt):**
- Når du får OpenAI API key, legg den til i Supabase Secrets
- Oppdater `generateAIResponse` funksjonen for bedre AI-svar

---

## 📝 Quick Reference

**Deploy på nytt etter endringer:**
```bash
npx supabase functions deploy sofie-chat
```

**Se logs (for debugging):**
```bash
npx supabase functions logs sofie-chat
```

**Test lokalt (valgfritt):**
```bash
npx supabase functions serve sofie-chat
```
