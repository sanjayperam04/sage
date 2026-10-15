'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Edit3, Search, Plus, Check, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
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
  breakdown?: { item: string; portion: string; calories: number; protein: number }[]
}

const GYM_PRESETS = [
  '2 scoops whey protein with 300ml whole milk',
  '200g grilled chicken breast with 1 cup white rice',
  '4 boiled eggs with 2 slices of whole wheat toast',
  '150g paneer bhurji with 2 rotis and 1 bowl dal',
  '1 bowl oatmeal with 1 banana and 1 tbsp peanut butter',
]

export default function LogPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>Loading logger...</div>}>
      <LogContent />
    </Suspense>
  )
}

function LogContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const paramMeal = searchParams.get('meal') as typeof MEAL_TYPES[number] | null
  const initialMeal = paramMeal && MEAL_TYPES.includes(paramMeal) ? paramMeal : 'lunch'

  const [mode, setMode] = useState<'ai' | 'manual' | 'database'>('ai')
  const [mealType, setMealType] = useState<typeof MEAL_TYPES[number]>(initialMeal)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [userId, setUserId] = useState<string>('')

  // AI state
  const [aiText, setAiText] = useState('')
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Manual state
  const [manualForm, setManualForm] = useState({
    name: '',
    quantity: '100',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [supabase])

  async function analyzeWithAI(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!aiText.trim()) return
    setAiLoading(true)
    setAiResult(null)
    setAiError(null)
    try {
      const res = await fetch('/api/ai/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiText, mealType }),
      })
      const data = await res.json()
      if (data.error) {
        setAiError(data.error)
      } else if (data.result) {
        setAiResult(data.result)
      }
    } catch {
      setAiError('Could not connect to Sage AI service. Please try again.')
    }
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
    if (!error) {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 1000)
    }
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
    if (!error) {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 1000)
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      {success && (
        <div className={styles.successOverlay}>
          <div className={styles.successCircle}>
            <Check size={32} strokeWidth={3} />
          </div>
          <p className="t-tagline">Meal Secured</p>
        </div>
      )}

      <div className="container">
        {/* Header */}
        <header className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-xs)' }}>
            <Link href="/dashboard" style={{ color: 'var(--ink-muted-80)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
          <h1 className={styles.title}>Fuel Entry</h1>
          <p className={styles.subtitle}>Log recovery nutrition with precision</p>
        </header>

        {/* Meal Type Pill Selector */}
        <div className={styles.mealTypeSelector}>
          {MEAL_TYPES.map(type => (
            <button
              key={type}
              id={`meal-type-${type}`}
              onClick={() => setMealType(type)}
              className={`${styles.mealTypeBtn} ${mealType === type ? styles.mealTypeBtnActive : ''}`}
            >
              <span style={{ textTransform: 'capitalize' }}>{type}</span>
            </button>
          ))}
        </div>

        {/* Segmented Mode Switcher */}
        <div className={styles.modeSegmentedBar}>
          <button
            id="mode-ai"
            onClick={() => setMode('ai')}
            className={`${styles.modeSegmentBtn} ${mode === 'ai' ? styles.modeSegmentBtnActive : ''}`}
          >
            <Sparkles size={14} strokeWidth={2.2} />
            <span>AI Parser</span>
          </button>
          <button
            id="mode-manual"
            onClick={() => setMode('manual')}
            className={`${styles.modeSegmentBtn} ${mode === 'manual' ? styles.modeSegmentBtnActive : ''}`}
          >
            <Edit3 size={14} strokeWidth={2.2} />
            <span>Manual</span>
          </button>
          <button
            id="mode-database"
            onClick={() => setMode('database')}
            className={`${styles.modeSegmentBtn} ${mode === 'database' ? styles.modeSegmentBtnActive : ''}`}
          >
            <Search size={14} strokeWidth={2.2} />
            <span>Foods</span>
          </button>
        </div>

        {/* ── MODE 1: AI PARSER ── */}
        {mode === 'ai' && (
          <div className={styles.aiPanel}>
            <form onSubmit={analyzeWithAI} className={styles.aiInputCard}>
              <textarea
                id="ai-description"
                className={styles.aiTextarea}
                placeholder="Describe your meal (e.g. 2 scoops whey with 300ml whole milk, or 200g chicken with 1 cup rice)"
                value={aiText}
                onChange={e => setAiText(e.target.value)}
                rows={3}
              />
              <div className={styles.aiActionsRow}>
                <span className={styles.aiHint}>Natural language food reasoning</span>
                <button
                  id="ai-analyze-submit"
                  type="submit"
                  className="btn-primary"
                  disabled={aiLoading || !aiText.trim()}
                  style={{ minHeight: '38px', padding: '8px 18px', fontSize: '13px' }}
                >
                  <Sparkles size={14} strokeWidth={2.2} />
                  <span>{aiLoading ? 'Calculating...' : 'Analyze'}</span>
                </button>
              </div>
            </form>

            {/* Quick Gym Presets */}
            <div className={styles.presetPresetsRow}>
              <span className={styles.presetsTitle}>Post-Gym Staples</span>
              <div className={styles.presetsScroll}>
                {GYM_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAiText(preset)
                    }}
                    className={styles.presetChip}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {aiError && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(255, 69, 58, 0.1)',
                border: '1px solid rgba(255, 69, 58, 0.25)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--macro-fat)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertCircle size={15} />
                <span>{aiError}</span>
              </div>
            )}

            {/* AI Result Card */}
            {aiResult && (
              <div className={`${styles.resultCard} animate-fade-up`}>
                <div className={styles.resultHeader}>
                  <div>
                    <h3 className={styles.resultTitle}>{aiResult.name}</h3>
                    <p className={styles.resultServing}>{aiResult.serving_description}</p>
                  </div>
                  <div>
                    <p className={`${styles.resultCaloriesValue} tabular`}>{aiResult.calories}</p>
                    <p className={styles.resultCaloriesUnit}>KCAL</p>
                  </div>
                </div>

                <div className={styles.resultMacrosGrid}>
                  <div className={styles.macroChipBox}>
                    <span className={`${styles.macroChipVal} tabular`} style={{ color: '#FFFFFF' }}>{aiResult.protein}g</span>
                    <span className={styles.macroChipName}>Protein</span>
                  </div>
                  <div className={styles.macroChipBox}>
                    <span className={`${styles.macroChipVal} tabular`} style={{ color: '#FFFFFF' }}>{aiResult.carbs}g</span>
                    <span className={styles.macroChipName}>Carbs</span>
                  </div>
                  <div className={styles.macroChipBox}>
                    <span className={`${styles.macroChipVal} tabular`} style={{ color: '#FFFFFF' }}>{aiResult.fat}g</span>
                    <span className={styles.macroChipName}>Fat</span>
                  </div>
                  <div className={styles.macroChipBox}>
                    <span className={`${styles.macroChipVal} tabular`} style={{ color: '#FFFFFF' }}>{aiResult.fiber}g</span>
                    <span className={styles.macroChipName}>Fiber</span>
                  </div>
                </div>

                {/* Itemized Breakdown */}
                {aiResult.breakdown && aiResult.breakdown.length > 0 && (
                  <div style={{
                    marginTop: 'var(--space-md)',
                    paddingTop: 'var(--space-md)',
                    borderTop: '1px solid var(--hairline)',
                    marginBottom: 'var(--space-md)',
                  }}>
                    <p className="t-fine" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-xs)' }}>
                      Itemized Breakdown
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {aiResult.breakdown.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span>{item.item} <span style={{ color: 'var(--ink-muted-48)', fontSize: '11px' }}>({item.portion})</span></span>
                          <span className="tabular" style={{ fontWeight: 600 }}>{item.calories} kcal · <span style={{ color: '#FFFFFF' }}>{item.protein}g P</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                  <button
                    id="ai-save-btn"
                    onClick={saveAIEntry}
                    disabled={loading}
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    <Plus size={16} strokeWidth={2.4} />
                    <span>{loading ? 'Saving...' : 'Add to Today'}</span>
                  </button>
                  <button
                    onClick={() => setAiResult(null)}
                    className="btn-secondary"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MODE 2: MANUAL ENTRY ── */}
        {mode === 'manual' && (
          <form onSubmit={saveManualEntry} className="card" style={{ maxWidth: '540px' }}>
            <h2 className="t-tagline" style={{ marginBottom: 'var(--space-md)' }}>Direct Macro Entry</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <label className="label">Meal / Food Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Post-Workout Shake"
                  value={manualForm.name}
                  onChange={e => setManualForm({ ...manualForm, name: e.target.value })}
                  className="input-rect"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
                <div>
                  <label className="label">Calories (kcal)</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={manualForm.calories}
                    onChange={e => setManualForm({ ...manualForm, calories: e.target.value })}
                    className="input-rect tabular"
                  />
                </div>
                <div>
                  <label className="label">Protein (g)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={manualForm.protein}
                    onChange={e => setManualForm({ ...manualForm, protein: e.target.value })}
                    className="input-rect tabular"
                  />
                </div>
                <div>
                  <label className="label">Carbs (g)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={manualForm.carbs}
                    onChange={e => setManualForm({ ...manualForm, carbs: e.target.value })}
                    className="input-rect tabular"
                  />
                </div>
                <div>
                  <label className="label">Fat (g)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={manualForm.fat}
                    onChange={e => setManualForm({ ...manualForm, fat: e.target.value })}
                    className="input-rect tabular"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: 'var(--space-xs)' }}>
                {loading ? 'Saving...' : 'Add Meal'}
              </button>
            </div>
          </form>
        )}

        {/* ── MODE 3: FOODS CATALOG ── */}
        {mode === 'database' && (
          <div className="card" style={{ maxWidth: '540px', textAlign: 'center', padding: 'var(--space-xxl) var(--space-md)' }}>
            <Search size={32} strokeWidth={1.8} color="var(--primary)" style={{ marginBottom: 'var(--space-sm)' }} />
            <h2 className="t-tagline" style={{ marginBottom: 'var(--space-xs)' }}>Food Catalog & Custom Foods</h2>
            <p className="t-caption" style={{ color: 'var(--ink-muted-80)', marginBottom: 'var(--space-lg)' }}>
              Manage and save custom fitness staples in your library.
            </p>
            <Link href="/foods" className="btn-primary">
              Open Foods Library
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
