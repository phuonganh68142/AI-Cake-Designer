'use client'
import { EchoSignIn } from '@merit-systems/echo-next-sdk/client'
import { useState } from 'react'

type Ingredient = { item: string; amount: string }
type Recipe = {
  name: string
  dietary_info: string
  serving_size: string
  ingredients?: Ingredient[]
  steps?: string[]
  decoration?: string
  flavor_note?: string
  estimated_time_min?: number
}

export default function Page() {
  const [mood, setMood] = useState('celebrating a birthday, want something elegant')
  const [base, setBase] = useState<'cake' | 'cupcake'>('cake')
  const [style, setStyle] = useState('classic')
  const [occasion, setOccasion] = useState('birthday party')
  const [ing, setIng] = useState('flour, eggs, sugar, butter, vanilla, milk')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string>('')

  async function generate() {
    try {
      setLoading(true)
      setErr('')
      setRecipes([])

      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, base, style, occasion, ingredientsCSV: ing }),
      })

      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(t || 'Failed to generate')
      }

      const data: { recipes?: Recipe[] } = await res.json()
      setRecipes(Array.isArray(data.recipes) ? data.recipes : [])
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      setErr(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cake-designer-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-pink)' }}>
          AI Cake Designer 🎂
        </h1>
        <EchoSignIn />
      </header>

      <p style={{ opacity: 0.8, margin: '12px 0 24px', fontSize: 16 }}>
        Describe your occasion and get 3–5 custom cake recipes crafted just for you.
      </p>

      <div style={{ display: 'grid', gap: 14 }}>
        <div className="input-wrapper">
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Your Occasion & Vibe
          </label>
          <textarea
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            rows={3}
            placeholder="e.g., elegant wedding, fun kids party, cozy afternoon tea..."
            style={{
              background: 'var(--input-bg)',
              border: '2px solid var(--border-color)',
              borderRadius: 12,
              padding: 14,
              width: '100%',
              transition: 'all 0.3s ease',
              color: 'var(--text-primary)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-pink)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="input-wrapper">
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Type
            </label>
            <select
              value={base}
              onChange={(e) => setBase(e.target.value as 'cake' | 'cupcake')}
              style={{
                background: 'var(--input-bg)',
                border: '2px solid var(--border-color)',
                borderRadius: 10,
                padding: 12,
                width: '100%',
                color: 'var(--text-primary)'
              }}
            >
              <option value="cake">Full Cake 🎂</option>
              <option value="cupcake">Cupcakes 🧁</option>
            </select>
          </div>

          <div className="input-wrapper">
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Style
            </label>
            <input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="classic, modern, rustic..."
              style={{
                background: 'var(--input-bg)',
                border: '2px solid var(--border-color)',
                borderRadius: 10,
                padding: 12,
                width: '100%',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-pink)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>
        </div>

        <div className="input-wrapper">
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Special Occasion
          </label>
          <input
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder="birthday, wedding, anniversary..."
            style={{
              background: 'var(--input-bg)',
              border: '2px solid var(--border-color)',
              borderRadius: 10,
              padding: 12,
              width: '100%',
              color: 'var(--text-primary)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-pink)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>

        <div className="input-wrapper">
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Available Ingredients
          </label>
          <input
            value={ing}
            onChange={(e) => setIng(e.target.value)}
            placeholder="flour, eggs, sugar, chocolate, berries..."
            style={{
              background: 'var(--input-bg)',
              border: '2px solid var(--border-color)',
              borderRadius: 10,
              padding: 12,
              width: '100%',
              color: 'var(--text-primary)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-pink)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>

        <button
          onClick={generate}
          disabled={loading || !mood.trim()}
          className="generate-button"
          style={{
            background: loading ? 'var(--accent-dark)' : 'linear-gradient(135deg, var(--accent-pink) 0%, var(--accent-dark) 100%)',
            color: '#ffffff',
            padding: '14px 20px',
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 16,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: loading ? 0.6 : 1,
            boxShadow: loading ? 'none' : '0 4px 12px var(--shadow)'
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {loading ? 'Baking... 🥄' : 'Generate Recipes 🎂'}
        </button>

        {err && (
          <div style={{
            color: '#dc2626',
            background: '#fee2e2',
            padding: 12,
            borderRadius: 10,
            border: '2px solid #fecaca'
          }}>
            {err}
          </div>
        )}
      </div>

      <section style={{ marginTop: 32, display: 'grid', gap: 20 }}>
        {recipes.map((r, i) => (
          <div
            key={i}
            className="recipe-card"
            style={{
              border: '2px solid var(--border-color)',
              borderRadius: 20,
              padding: 24,
              background: 'var(--card-bg)',
              boxShadow: '0 8px 24px var(--shadow)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 32px var(--shadow)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 24px var(--shadow)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
              <h3 style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--accent-pink)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                {r.name} {base === 'cupcake' ? '🧁' : '🎂'}
              </h3>
              <span style={{
                opacity: 0.8,
                background: 'var(--input-bg)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 14,
                border: '1px solid var(--border-color)'
              }}>
                {r.serving_size}
              </span>
            </div>

            {r.flavor_note && (
              <p style={{
                opacity: 0.85,
                marginBottom: 12,
                fontStyle: 'italic',
                color: 'var(--text-secondary)'
              }}>
                {r.flavor_note}
              </p>
            )}

            <div style={{
              background: 'var(--input-bg)',
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--accent-pink)' }}>Ingredients:</h4>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                {r.ingredients?.map((x: Ingredient, idx: number) => (
                  <li key={idx} style={{ color: 'var(--text-primary)' }}>
                    {x.amount} {x.item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{
              background: 'var(--input-bg)',
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--accent-pink)' }}>Instructions:</h4>
              <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                {r.steps?.map((s: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: 6, color: 'var(--text-primary)' }}>{s}</li>
                ))}
              </ol>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              opacity: 0.85,
              fontSize: 14
            }}>
              <span>
                <strong>Decoration:</strong> {r.decoration}
              </span>
              <span>
                <strong>Time:</strong> ~{r.estimated_time_min} min ⏱️
              </span>
              {r.dietary_info && (
                <span>
                  <strong>Dietary:</strong> {r.dietary_info}
                </span>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
