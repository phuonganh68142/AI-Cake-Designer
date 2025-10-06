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

// --- Schema for Cake Recipes ---
const Ingredient = z.object({
  item: z.string(),
  amount: z.string(),
})

const Recipe = z.object({
  name: z.string(),
  dietary_info: z.string().default('Contains gluten, dairy, eggs'),
  serving_size: z.enum(['6-8 servings', '8-10 servings', '10-12 servings', '12 cupcakes', '24 cupcakes']).default('8-10 servings'),
  ingredients: z.array(Ingredient).default([]),
  steps: z.array(z.string()).default([]),
  decoration: z.string().default(''),
  flavor_note: z.string().default(''),
  estimated_time_min: z.number().int().min(30).max(180).default(60),
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
      'You are "AI Cake Designer," a creative, detail-oriented pastry chef AI.',
      'Return ONLY valid JSON matching the schema. No markdown, no prose. Return exactly 3 cake recipes.',
      'Keep each recipe clear and under ~150 words.',
      'If BASE=cupcake, adjust serving_size to "12 cupcakes" or "24 cupcakes".',
      'If BASE=cake, use serving sizes like "8-10 servings".',
      'Prefer AVAILABLE_INGREDIENTS when possible.',
      'Include baking temperature and time in steps.',
      'Provide creative decoration suggestions.',
      'Example JSON:',
      `{
    "recipes": [
      {
        "name": "Classic Vanilla Birthday Cake",
        "dietary_info": "Contains gluten, dairy, eggs",
        "serving_size": "8-10 servings",
        "ingredients": [
          { "item": "all-purpose flour", "amount": "2 cups" },
          { "item": "granulated sugar", "amount": "1.5 cups" },
          { "item": "eggs", "amount": "3 large" },
          { "item": "butter", "amount": "1/2 cup" },
          { "item": "milk", "amount": "1 cup" },
          { "item": "vanilla extract", "amount": "2 tsp" }
        ],
        "steps": [
          "Preheat oven to 350°F (175°C)",
          "Cream butter and sugar until fluffy",
          "Add eggs one at a time, beating well",
          "Alternate adding flour and milk",
          "Pour into greased pans",
          "Bake for 30-35 minutes"
        ],
        "decoration": "Vanilla buttercream frosting with rainbow sprinkles",
        "flavor_note": "Light, fluffy, and perfectly sweet",
        "estimated_time_min": 60
      }
    ]
  }`,
    ].join(' ')

    const user = `OCCASION: ${mood}
EVENT TYPE: ${occasion || '-'}
STYLE: ${style || '-'}
CAKE TYPE: ${base}
AVAILABLE INGREDIENTS: ${ingredientsCSV || '-'}`

    // Try a couple model IDs in case one isn't enabled in Echo
    const modelIds: ReadonlyArray<string> = ['gpt-4o-mini', 'gpt-4o']
    let lastError: unknown = null

    for (const id of modelIds) {
      try {
        const { object } = await generateObject({
          model: provider(id),
          system,
          prompt: user,
          schema: OutputSchema,
          temperature: 0.7,
          maxOutputTokens: 1200,
        })

        return Response.json(object, { 
          headers: { 'Content-Type': 'application/json' } 
        })
      } catch (e) {
        lastError = e
      }
    }

    const detail =
      lastError instanceof Error 
        ? lastError.message 
        : typeof lastError === 'string' 
        ? lastError 
        : 'Unknown model error'
    
    console.error('cake recipes route model error:', lastError)
    
    return new Response(
      JSON.stringify({ 
        error: 'Model did not return valid JSON', 
        detail 
      }),
      { 
        status: 502, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  } catch (err) {
    const message = 
      err instanceof Error 
        ? err.message 
        : typeof err === 'string' 
        ? err 
        : 'Unknown error'
    
    console.error('cake recipes route error:', err)
    
    return new Response(
      JSON.stringify({ 
        error: 'Bad request or server error', 
        detail: message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}
