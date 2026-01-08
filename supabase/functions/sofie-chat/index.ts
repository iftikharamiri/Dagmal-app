// Supabase Edge Function for Sofie AI Chat
// Uses GPT-3.5 to intelligently search deals and answer questions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  message: string
  userId?: string
  location?: { lat: number; lng: number }
  city?: string
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Get all active deals from database
async function getAllDeals(supabase: any, userLocation?: { lat: number; lng: number }) {
  const { data: deals, error } = await supabase
    .from('deals')
    .select(`
      *,
      restaurants (
        id, name, address, city, lat, lng, categories, image_url
      )
    `)
    .eq('is_active', true)

  if (error) {
    console.error('Database error:', error)
    return []
  }

  // Add distance if user location is available
  if (userLocation && deals) {
    return deals.map((deal: any) => {
      if (deal.restaurants?.lat && deal.restaurants?.lng) {
        const distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          deal.restaurants.lat, deal.restaurants.lng
        )
        return { ...deal, distance }
      }
      return { ...deal, distance: null }
    })
  }

  return deals || []
}

// Format deals for GPT context (compact format to save tokens)
function formatDealsForGPT(deals: any[]): string {
  if (deals.length === 0) return 'Ingen tilbud tilgjengelig.'
  
  return deals.map((deal, i) => {
    const r = deal.restaurants
    const price = deal.final_price ? `${(deal.final_price / 100).toFixed(0)}kr` : 'gratis'
    const origPrice = deal.original_price ? `${(deal.original_price / 100).toFixed(0)}kr` : ''
    const dist = deal.distance ? `${deal.distance.toFixed(1)}km` : ''
    const time = `${deal.start_time?.slice(0,5)}-${deal.end_time?.slice(0,5)}`
    
    return `[${i}] "${deal.title}" - ${r?.name || 'Ukjent'} (${r?.city || ''}) | ${deal.discount_percentage}% rabatt | ${origPrice}→${price} | ${time} | ${dist}`
  }).join('\n')
}

// Main AI function - uses GPT-3.5 to understand and search
async function processWithAI(
  userMessage: string,
  deals: any[],
  userCity?: string,
  openaiApiKey?: string
): Promise<{ reply: string; selectedDeals: any[] }> {
  
  // If no API key, use simple keyword matching
  if (!openaiApiKey) {
    console.log('No OpenAI key - using simple search')
    return simpleSearch(userMessage, deals, userCity)
  }

  const dealsContext = formatDealsForGPT(deals)
  
  const systemPrompt = `Du er Sofie, en vennlig norsk mat-assistent for appen Spisly.

DINE OPPGAVER:
1. Forstå hva brukeren leter etter (mattype, sted, pris, etc.)
2. Søk gjennom tilbudene og finn de beste matchene
3. Svar på norsk, kort og vennlig (2-3 setninger)
4. Bruk 1-2 emojis

TILGJENGELIGE TILBUD:
${dealsContext}

VIKTIGE REGLER:
- Analyser ALLE tilbudene og finn de som matcher brukerens forespørsel
- Match på tittel, beskrivelse, restaurantnavn, kategori, eller mattype
- Hvis brukeren spør om "bakt potet", søk etter tilbud som inneholder "potet", "bakt", eller lignende
- Hvis brukeren spør om en by, filtrer på den byen
- Hvis ingen tilbud matcher, foreslå lignende alternativer
- IKKE list opp detaljer - kortene vises automatisk under meldingen

SVAR FORMAT (JSON):
{
  "reply": "Din vennlige melding her",
  "matchingIndexes": [0, 2, 5]
}

matchingIndexes skal være en liste med indekser [0], [1], [2] etc. fra tilbudslisten som matcher brukerens forespørsel.
Maks 4 tilbud. Sorter etter relevans og rabatt.
Hvis ingen matcher, returner tom liste: []
Hvis det er et generelt spørsmål (ikke om mat), svar på det og returner tom liste.`

  const userPrompt = `Bruker${userCity ? ` (i ${userCity})` : ''}: "${userMessage}"

Analyser tilbudene og finn de beste matchene. Svar i JSON-format.`

  try {
    console.log('Calling GPT-3.5 for intelligent search...')
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower for more consistent results
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      console.error('OpenAI error:', response.status)
      return simpleSearch(userMessage, deals, userCity)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return simpleSearch(userMessage, deals, userCity)
    }

    console.log('GPT response:', content)

    // Parse JSON response
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = content
      if (content.includes('```')) {
        const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (match) jsonStr = match[1]
      }
      
      const parsed = JSON.parse(jsonStr.trim())
      const matchingIndexes = parsed.matchingIndexes || []
      const selectedDeals = matchingIndexes
        .filter((i: number) => i >= 0 && i < deals.length)
        .map((i: number) => deals[i])
        .slice(0, 4) // Max 4 deals

      // Sort by discount percentage
      selectedDeals.sort((a: any, b: any) => 
        (b.discount_percentage || 0) - (a.discount_percentage || 0)
      )

      return {
        reply: parsed.reply || 'Her er det jeg fant! 🍽️',
        selectedDeals
      }
    } catch (parseError) {
      console.log('JSON parse failed, extracting text response')
      // If JSON parsing fails, just use the text response
      return {
        reply: content.replace(/```[\s\S]*```/g, '').trim() || 'Her er noen tilbud for deg! 🍽️',
        selectedDeals: simpleSearch(userMessage, deals, userCity).selectedDeals
      }
    }

  } catch (error) {
    console.error('AI error:', error)
    return simpleSearch(userMessage, deals, userCity)
  }
}

// Simple keyword-based search (fallback)
function simpleSearch(
  message: string,
  deals: any[],
  userCity?: string
): { reply: string; selectedDeals: any[] } {
  const lowerMessage = message.toLowerCase()
  
  // Check if it's a general question (not about food)
  const generalPatterns = [
    /hva er hovedstaden/i, /hvem er/i, /når ble/i, /hvor mange/i,
    /hvorfor/i, /fortell meg om/i, /hva betyr/i
  ]
  
  if (generalPatterns.some(p => p.test(message))) {
    return {
      reply: 'Jeg er best på å finne mattilbud! 🍕 Spør meg om mat, restauranter eller tilbud i nærheten.',
      selectedDeals: []
    }
  }

  // Filter by city if mentioned or provided
  let filteredDeals = deals
  if (userCity) {
    const cityLower = userCity.toLowerCase().replace(/å/g, 'a').replace(/ø/g, 'o').replace(/æ/g, 'ae')
    filteredDeals = deals.filter(d => {
      const dealCity = (d.restaurants?.city || '').toLowerCase().replace(/å/g, 'a').replace(/ø/g, 'o').replace(/æ/g, 'ae')
      return dealCity.includes(cityLower) || cityLower.includes(dealCity)
    })
    
    // If no deals in city, use all deals
    if (filteredDeals.length === 0) {
      filteredDeals = deals
    }
  }

  // Search in title, description, restaurant name, categories
  const searchTerms = lowerMessage.split(/\s+/).filter(t => t.length > 2)
  
  const scoredDeals = filteredDeals.map(deal => {
    let score = 0
    const title = (deal.title || '').toLowerCase()
    const desc = (deal.description || '').toLowerCase()
    const restName = (deal.restaurants?.name || '').toLowerCase()
    const categories = (deal.restaurants?.categories || []).join(' ').toLowerCase()
    const searchText = `${title} ${desc} ${restName} ${categories}`
    
    for (const term of searchTerms) {
      if (searchText.includes(term)) {
        score += 10
        if (title.includes(term)) score += 5 // Bonus for title match
      }
    }
    
    // Bonus for high discount
    score += (deal.discount_percentage || 0) / 10
    
    return { deal, score }
  })

  // Get top matches
  const matches = scoredDeals
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(s => s.deal)

  if (matches.length === 0) {
    // Return top deals by discount if no matches
    const topDeals = [...filteredDeals]
      .sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0))
      .slice(0, 4)
    
    return {
      reply: `Jeg fant ikke akkurat det du søkte etter, men her er noen gode tilbud! 🍽️`,
      selectedDeals: topDeals
    }
  }

  return {
    reply: `Fant ${matches.length} tilbud for deg! 🎉`,
    selectedDeals: matches
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Sofie Chat Request ===')

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { message, userId, location, city }: ChatRequest = await req.json()
    
    console.log('Message:', message)
    console.log('City:', city)
    console.log('Has OpenAI key:', !!openaiApiKey)

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all deals from database
    const allDeals = await getAllDeals(supabase, location)
    console.log(`Loaded ${allDeals.length} deals from database`)

    // Process with AI
    const result = await processWithAI(message, allDeals, city, openaiApiKey)
    
    console.log('Reply:', result.reply)
    console.log('Selected deals:', result.selectedDeals.length)

    return new Response(
      JSON.stringify({
        reply: result.reply,
        deals: result.selectedDeals,
        restaurants: result.selectedDeals
          .map(d => d.restaurants)
          .filter((r, i, arr) => r && arr.findIndex(x => x?.id === r.id) === i),
        intent: { foodType: '', isFoodSearch: result.selectedDeals.length > 0 },
        location: location ? { ...location, city } : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
