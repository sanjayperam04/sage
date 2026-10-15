'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Food } from '@/lib/types'
import styles from './log.module.css'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

interface AIResult {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  serving_description: string
  confidence: string
}

export default function LogPage() {
  const router = useRouter()
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // Mode
  const [mode, setMode] = useState<'ai' | 'manual' | 'database'>('ai')

  // Shared
  const [mealType, setMealType] = useState<string>('lunch')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [userId, setUserId] = useState<string>('')

  // AI mode
  const [aiText, setAiText] = useState('')
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Manual mode
  const [manualForm, setManualForm] = useState({
    name: '', quantity: '100', calories: '', protein: '', carbs: '', fat: '', fiber: ''
  })

  // Database mode
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Food[]>([])
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [servingGrams, setServingGrams] = useState('100')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
    // Set default meal type based on time
    const h = new Date().getHours()
    if (h < 10) setMealType('breakfast')
    else if (h < 14) setMealType('lunch')
    else if (h < 20) setMealType('dinner')
    else setMealType('snack')
  }, [])

  const searchFoods = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return }
    const { data } = await supabase
      .from('foods')
      .select('*')
      .ilike('name', `%${q}%`)
      .limit(12)
    setSearchResults(data || [])
  }, [supabase])

  useEffect(() => {
    const t = setTimeout(() => searchFoods(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery, searchFoods])

  async function analyzeWithAI(e: React.FormEvent) {
    e.preventDefault()
    if (!aiText.trim()) return
    setAiLoading(true)
    setAiResult(null)
    try {
      const res = await fetch('/api/ai/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiText, mealType }),
      })
      const data = await res.json()
      if (data.result) setAiResult(data.result)
    } catch { /* silent */ }
    setAiLoading(false)
  }

  async function saveAIEntry() {
    if (!aiResult || !userId) return
    setLoading(true)
    const { error } = await supabase.from('food_logs').insert({
      user_id: userId,
      food_name: aiResult.name,
      logged_date: today,
      meal_type: mealType,
      quantity_g: 100,
      calories: aiResult.calories,
      protein_g: aiResult.protein,
      carbs_g: aiResult.carbs,
      fat_g: aiResult.fat,
      fiber_g: aiResult.fiber,
      ai_generated: true,
    })
    if (!error) { setSuccess(true); setTimeout(() => router.push('/dashboard'), 1200) }
    setLoading(false)
  }

  async function saveManualEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !manualForm.name) return
    setLoading(true)
    const qty = parseFloat(manualForm.quantity) || 100
    const { error } = await supabase.from('food_logs').insert({
      user_id: userId,
      food_name: manualForm.name,
      logged_date: today,
      meal_type: mealType,
      quantity_g: qty,
      calories: parseFloat(manualForm.calories) || 0,
      protein_g: parseFloat(manualForm.protein) || 0,
      carbs_g: parseFloat(manualForm.carbs) || 0,
      fat_g: parseFloat(manualForm.fat) || 0,
      fiber_g: parseFloat(manualForm.fiber) || 0,
      ai_generated: false,
    })
    if (!error) { setSuccess(true); setTimeout(() => router.push('/dashboard'), 1200) }
    setLoading(false)
  }

  async function saveDatabaseEntry() {
    if (!selectedFood || !userId) return
    setLoading(true)
    const qty = parseFloat(servingGrams) || selectedFood.default_serving_g
    const ratio = qty / 100
    const { error } = await supabase.from('food_logs').insert({
      user_id: userId,
      food_id: selectedFood.id,
      food_name: selectedFood.name,
      logged_date: today,
      meal_type: mealType,
      quantity_g: qty,
      calories: selectedFood.calories_per_100g * ratio,
      protein_g: selectedFood.protein_per_100g * ratio,
      carbs_g: selectedFood.carbs_per_100g * ratio,
      fat_g: selectedFood.fat_per_100g * ratio,
      fiber_g: selectedFood.fiber_per_100g * ratio,
      ai_generated: false,
    })
    if (!error) { setSuccess(true); setTimeout(() => router.push('/dashboard'), 1200) }
    setLoading(false)
  }

  const dbCalories = selectedFood
    ? Math.round(selectedFood.calories_per_100g * (parseFloat(servingGrams) || 100) / 100)
    : 0

  if (success) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successIcon}>✅</div>
        <h1 className="t-display-md">Logged!</h1>
        <p className="t-body" style={{ color: 'var(--ink-muted-48)' }}>Redirecting to your dashboard...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Header tile */}
      <section className="tile tile-dark">
        <div className="tile-content">
          <h1 className="t-display-md" style={{ color: 'var(--on-dark)', marginBottom: 'var(--space-sm)' }}>
            Log a Meal
          </h1>
          <p className="t-caption" style={{ color: 'var(--body-muted)', marginBottom: 'var(--space-xl)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          {/* Meal type */}
          <div className={styles.mealTypeRow}>
            <label className="label label-on-dark">Meal</label>
            <div className={styles.mealChips}>
              {MEAL_TYPES.map(type => (
                <button
                  key={type}
                  id={`meal-type-${type}`}
                  onClick={() => setMealType(type)}
                  className={`chip ${mealType === type ? 'chip-active' : ''}`}
                  style={{
                    background: mealType === type ? 'rgba(41,151,255,0.15)' : 'rgba(255,255,255,0.08)',
                    borderColor: mealType === type ? 'var(--primary-on-dark)' : 'rgba(255,255,255,0.15)',
                    color: mealType === type ? 'var(--primary-on-dark)' : 'var(--body-muted)',
                  }}
                >
                  {getMealEmoji(type)} {capitalize(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Mode switcher */}
          <div className={styles.modeSwitcher}>
            {(['ai', 'database', 'manual'] as const).map(m => (
              <button
                key={m}
                id={`mode-${m}`}
                onClick={() => setMode(m)}
                className={styles.modeBtn}
                style={{
                  background: mode === m ? 'var(--canvas)' : 'transparent',
                  color: mode === m ? 'var(--ink)' : 'var(--body-muted)',
                }}
              >
                {m === 'ai' && '✨ AI'}
                {m === 'database' && '🔍 Database'}
                {m === 'manual' && '✏️ Manual'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Input tile */}
      <section className="tile tile-parchment" style={{ minHeight: '60vh' }}>
        <div className="tile-content">

          {/* ── AI MODE ── */}
          {mode === 'ai' && (
            <div className={styles.modePanel}>
              <h2 className="t-tagline" style={{ marginBottom: 'var(--space-md)' }}>Describe what you ate</h2>
              <p className="t-caption" style={{ color: 'var(--ink-muted-48)', marginBottom: 'var(--space-xl)' }}>
                Write naturally — "2 rotis with dal", "bowl of oatmeal with banana", "grilled chicken 200g"
              </p>
              <form onSubmit={analyzeWithAI} className={styles.aiInputRow}>
                <textarea
                  id="ai-description"
                  className={styles.aiTextarea}
                  placeholder='e.g. "2 rotis with dal tadka and a glass of skimmed milk"'
                  value={aiText}
                  onChange={e => setAiText(e.target.value)}
                  rows={3}
                />
                <button id="ai-analyze-submit" type="submit" className="btn-primary" disabled={aiLoading || !aiText.trim()} style={{ alignSelf: 'flex-end' }}>
                  {aiLoading ? '⟳ Analyzing...' : '✨ Analyze with AI'}
                </button>
              </form>

              {aiLoading && (
                <div className={styles.aiLoading}>
                  <div className={styles.aiLoadingDot} /><div className={styles.aiLoadingDot} /><div className={styles.aiLoadingDot} />
                  <span className="t-caption" style={{ color: 'var(--ink-muted-48)' }}>Groq AI is analyzing your meal...</span>
                </div>
              )}

              {aiResult && (
                <div className={`${styles.resultCard} animate-fade-up`}>
                  <div className={styles.resultHeader}>
                    <div>
                      <h3 className="t-body-strong">{aiResult.name}</h3>
                      <p className="t-caption" style={{ color: 'var(--ink-muted-48)' }}>
                        {aiResult.serving_description}
                        {aiResult.confidence !== 'high' && (
                          <span className={styles.confidenceBadge} style={{ background: aiResult.confidence === 'medium' ? '#fff3cd' : '#ffe5e5', color: aiResult.confidence === 'medium' ? '#856404' : '#c00' }}>
                            {aiResult.confidence} confidence
                          </span>
                        )}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p className="t-tagline" style={{ color: 'var(--primary)' }}>{aiResult.calories}</p>
                      <p className="t-fine" style={{ color: 'var(--ink-muted-48)' }}>kcal</p>
                    </div>
                  </div>

                  <div className={styles.resultMacros}>
                    {[
                      { label: 'Protein', value: aiResult.protein, unit: 'g', color: '#4CAF50' },
                      { label: 'Carbs',   value: aiResult.carbs,   unit: 'g', color: '#FF9800' },
                      { label: 'Fat',     value: aiResult.fat,     unit: 'g', color: '#E91E63' },
                      { label: 'Fiber',   value: aiResult.fiber,   unit: 'g', color: '#9C27B0' },
                    ].map(m => (
                      <div key={m.label} className={styles.macroChip}>
                        <span className="t-body-strong" style={{ color: m.color }}>{m.value}{m.unit}</span>
                        <span className="t-fine">{m.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.resultActions}>
                    <button id="ai-save-log-btn" onClick={saveAIEntry} disabled={loading} className="btn-primary">
                      {loading ? 'Saving...' : '+ Add to Log'}
                    </button>
                    <button id="ai-retry-btn" onClick={() => setAiResult(null)} className="btn-secondary">
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── DATABASE MODE ── */}
          {mode === 'database' && (
            <div className={styles.modePanel}>
              <h2 className="t-tagline" style={{ marginBottom: 'var(--space-md)' }}>Search Food Database</h2>
              <p className="t-caption" style={{ color: 'var(--ink-muted-48)', marginBottom: 'var(--space-xl)' }}>
                60+ foods pre-loaded including Indian staples
              </p>
              <input
                id="food-search-input"
                type="search"
                className="input"
                placeholder="Search: rice, chicken, dal, oats..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ marginBottom: 'var(--space-lg)' }}
              />

              {searchResults.length > 0 && !selectedFood && (
                <div className={styles.searchResults}>
                  {searchResults.map(food => (
                    <button
                      key={food.id}
                      id={`food-result-${food.id}`}
                      onClick={() => { setSelectedFood(food); setServingGrams(String(food.default_serving_g)) }}
                      className={styles.foodResult}
                    >
                      <div>
                        <p className="t-body-strong">{food.name}</p>
                        <p className="t-caption" style={{ color: 'var(--ink-muted-48)' }}>{food.serving_description}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p className="t-caption-strong">{Math.round(food.calories_per_100g * food.default_serving_g / 100)} kcal</p>
                        <p className="t-fine" style={{ color: 'var(--ink-muted-48)' }}>per serving</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedFood && (
                <div className={`${styles.resultCard} animate-fade-up`}>
                  <div className={styles.resultHeader}>
                    <div>
                      <h3 className="t-body-strong">{selectedFood.name}</h3>
                      <p className="t-caption" style={{ color: 'var(--ink-muted-48)' }}>{selectedFood.serving_description}</p>
                    </div>
                    <button onClick={() => setSelectedFood(null)} className="btn-secondary" style={{ fontSize: '13px', padding: '6px 14px' }}>
                      Change
                    </button>
                  </div>

                  <div className={styles.servingRow}>
                    <label htmlFor="serving-grams" className="label">Serving (grams)</label>
                    <input
                      id="serving-grams"
                      type="number"
                      className="input-rect"
                      value={servingGrams}
                      onChange={e => setServingGrams(e.target.value)}
                      min="1"
                      style={{ width: '120px' }}
                    />
                    <span className="t-tagline" style={{ color: 'var(--primary)' }}>{dbCalories} kcal</span>
                  </div>

                  <div className={styles.resultMacros}>
                    {[
                      { label: 'Protein', value: Math.round(selectedFood.protein_per_100g * (parseFloat(servingGrams)||100) / 100), color: '#4CAF50' },
                      { label: 'Carbs',   value: Math.round(selectedFood.carbs_per_100g * (parseFloat(servingGrams)||100) / 100),   color: '#FF9800' },
                      { label: 'Fat',     value: Math.round(selectedFood.fat_per_100g * (parseFloat(servingGrams)||100) / 100),     color: '#E91E63' },
                    ].map(m => (
                      <div key={m.label} className={styles.macroChip}>
                        <span className="t-body-strong" style={{ color: m.color }}>{m.value}g</span>
                        <span className="t-fine">{m.label}</span>
                      </div>
                    ))}
                  </div>

                  <button id="db-save-btn" onClick={saveDatabaseEntry} disabled={loading} className="btn-primary">
                    {loading ? 'Saving...' : '+ Add to Log'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── MANUAL MODE ── */}
          {mode === 'manual' && (
            <div className={styles.modePanel}>
              <h2 className="t-tagline" style={{ marginBottom: 'var(--space-md)' }}>Enter Manually</h2>
              <p className="t-caption" style={{ color: 'var(--ink-muted-48)', marginBottom: 'var(--space-xl)' }}>
                Know the exact nutrition values? Enter them directly.
              </p>
              <form onSubmit={saveManualEntry} className={styles.manualForm}>
                <div className={styles.field}>
                  <label htmlFor="manual-name" className="label">Food Name *</label>
                  <input id="manual-name" type="text" className="input-rect" placeholder="e.g. Protein shake" value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className={styles.gridRow}>
                  <div className={styles.field}>
                    <label htmlFor="manual-qty" className="label">Quantity (g)</label>
                    <input id="manual-qty" type="number" className="input-rect" value={manualForm.quantity} onChange={e => setManualForm(f => ({ ...f, quantity: e.target.value }))} min="1" />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="manual-cal" className="label">Calories (kcal) *</label>
                    <input id="manual-cal" type="number" className="input-rect" placeholder="0" value={manualForm.calories} onChange={e => setManualForm(f => ({ ...f, calories: e.target.value }))} min="0" required />
                  </div>
                </div>
                <div className={styles.gridRow}>
                  <div className={styles.field}>
                    <label htmlFor="manual-protein" className="label">Protein (g)</label>
                    <input id="manual-protein" type="number" className="input-rect" placeholder="0" value={manualForm.protein} onChange={e => setManualForm(f => ({ ...f, protein: e.target.value }))} min="0" step="0.1" />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="manual-carbs" className="label">Carbs (g)</label>
                    <input id="manual-carbs" type="number" className="input-rect" placeholder="0" value={manualForm.carbs} onChange={e => setManualForm(f => ({ ...f, carbs: e.target.value }))} min="0" step="0.1" />
                  </div>
                </div>
                <div className={styles.gridRow}>
                  <div className={styles.field}>
                    <label htmlFor="manual-fat" className="label">Fat (g)</label>
                    <input id="manual-fat" type="number" className="input-rect" placeholder="0" value={manualForm.fat} onChange={e => setManualForm(f => ({ ...f, fat: e.target.value }))} min="0" step="0.1" />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="manual-fiber" className="label">Fiber (g)</label>
                    <input id="manual-fiber" type="number" className="input-rect" placeholder="0" value={manualForm.fiber} onChange={e => setManualForm(f => ({ ...f, fiber: e.target.value }))} min="0" step="0.1" />
                  </div>
                </div>
                <button id="manual-save-btn" type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 'var(--space-md)' }}>
                  {loading ? 'Saving...' : '+ Add to Log'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
function getMealEmoji(type: string) {
  return { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }[type] || '🍽️'
}
