import { generateObject } from 'ai'
import type { LanguageModel } from 'ai'
import { z } from 'zod'
import { openai } from '../../../echo'

export const runtime = 'edge'

// Minimal, lint-safe typing for the Echo model provider
type ModelFactory = (id: string) => LanguageModel
type BindableProvider = ModelFactory & {
  bind?: (opts: { request: Request }) => BindableProvider
}

// --- Schema (guarantees valid JSON shape) ---
const Ingredient = z.object({
  item: z.string(),
  amount: z.string(),
})

const Recipe = z.object({
  name: z.string(),
  alcohol_free: z.boolean(),
  glass: z.enum(['rocks','highball','coupe','martini','collins','mug','wine']).default('rocks'),
  ingredients: z.array(Ingredient).default([]),
  steps: z.array(z.string()).default([]),
  garnish: z.string().default(''),
  vibe_note: z.string().default(''),
  estimated_time_min: z.number().int().min(1).max(10).default(3),
})

const OutputSchema = z.object({
  recipes: z.array(Recipe).min(1).max(5),
})

export async function POST(req: Request) {
  try {
    const { mood, occasion, style, base, ingredientsCSV } = await req.json()

    // Bind provider to this request if supported (for Echo auth/session)
    const maybeBindable = openai as unknown as BindableProvider
    const provider: BindableProvider =
      typeof maybeBindable.bind === 'function'
        ? maybeBindable.bind({ request: req })
        : maybeBindable

    const system = [
      'You are “AI Bartender,” a concise, safety-conscious mixologist.',
'Return ONLY valid JSON matching the schema. No markdown, no prose. Return exactly 3 recipes.',
      'Keep each recipe under ~120 words.',
      'If BASE=mocktail or user implies no alcohol, set alcohol_free=true and avoid spirits.',
      'Prefer AVAILABLE_INGREDIENTS when possible.',
     'Example JSON:',
  `{
    "recipes": [
      {
        "name": "Citrus Breeze",
        "alcohol_free": true,
        "glass": "highball",
        "ingredients": [
          { "item": "lime juice", "amount": "20 ml" },
          { "item": "ginger syrup", "amount": "10 ml" },
          { "item": "soda water", "amount": "100 ml" }
        ],
        "steps": ["Build over ice", "Top with soda", "Stir gently"],
        "garnish": "mint sprig",
        "vibe_note": "Light, zesty, and refreshing",
        "estimated_time_min": 3
      }
    ]
  }`,
].join(' ')

    const user = `MOOD: ${mood}
OCCASION: ${occasion || '-'}
STYLE: ${style || '-'}
BASE: ${base}
AVAILABLE_INGREDIENTS: ${ingredientsCSV || '-'}`

    // Try a couple model IDs in case one isn’t enabled in Echo
    const modelIds: ReadonlyArray<string> = ['gpt-4o-mini', 'gpt-4o']
    let lastError: unknown = null

    for (const id of modelIds) {
      try {
        const { object } = await generateObject({
          model: provider(id),              // <- now correctly typed as LanguageModel
          system,
          prompt: user,
          schema: OutputSchema,
          temperature: 0.6,
          maxOutputTokens: 800,
        })
        return Response.json(object, { headers: { 'Content-Type': 'application/json' } })
      } catch (e) {
        lastError = e
      }
    }

    const detail =
      lastError instanceof Error ? lastError.message : typeof lastError === 'string' ? lastError : 'Unknown model error'
    console.error('recipes route model error:', lastError)
    return new Response(
      JSON.stringify({ error: 'Model did not return valid JSON', detail }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error'
    console.error('recipes route error:', err)
    return new Response(
      JSON.stringify({ error: 'Bad request or server error', detail: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
