'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, FoodLog } from '@/lib/types'
import MacroPieChart from '@/components/MacroPieChart'
import WeekChart from '@/components/WeekChart'
import styles from './dashboard.module.css'

interface Props {
  profile: Profile
  todayLogs: FoodLog[]
  totals: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }
  waterGlasses: number
  weekData: { date: string; label: string; calories: number; protein: number }[]
  today: string
  userId: string
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

export default function DashboardClient({ profile, todayLogs, totals, waterGlasses, weekData, today, userId }: Props) {
  const [activeMeal, setActiveMeal] = useState<string>('all')
  const [waterCount, setWaterCount] = useState(waterGlasses)
  const [isAddingWater, setIsAddingWater] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const greeting = getGreeting()
  const displayName = profile.display_name || 'Friend'
  const dateStr = new Date(today).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  // Goals
  const calGoal = profile.daily_calorie_goal
  const proteinGoal = profile.daily_protein_goal
  const carbsGoal = profile.daily_carbs_goal
  const fatGoal = profile.daily_fat_goal
  const fiberGoal = profile.daily_fiber_goal
  const waterGoal = profile.daily_water_goal

  const calPct = Math.min((totals.calories / calGoal) * 100, 100)
  const calRemaining = Math.max(calGoal - totals.calories, 0)

  // Filter logs by meal type
  const filteredLogs = activeMeal === 'all'
    ? todayLogs
    : todayLogs.filter(l => l.meal_type === activeMeal)

  const logsByMeal = MEAL_TYPES.reduce((acc, type) => {
    acc[type] = todayLogs.filter(l => l.meal_type === type)
    return acc
  }, {} as Record<string, FoodLog[]>)

  async function addWater() {
    setIsAddingWater(true)
    const { error } = await supabase.from('water_logs').insert({
      user_id: userId,
      logged_date: today,
      glasses: 1,
      ml_per_glass: 250,
    })
    if (!error) setWaterCount(c => c + 1)
    setIsAddingWater(false)
  }

  async function removeWater() {
    if (waterCount === 0) return
    // Find last entry and remove 1 glass
    const { data: logs } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('logged_date', today)
      .order('created_at', { ascending: false })
      .limit(1)

    if (logs && logs.length > 0) {
      if (logs[0].glasses > 1) {
        await supabase.from('water_logs').update({ glasses: logs[0].glasses - 1 }).eq('id', logs[0].id)
      } else {
        await supabase.from('water_logs').delete().eq('id', logs[0].id)
      }
      setWaterCount(c => Math.max(c - 1, 0))
    }
  }

  async function deleteLog(id: string) {
    setDeletingId(id)
    await supabase.from('food_logs').delete().eq('id', id)
    router.refresh()
    setDeletingId(null)
  }

  return (
    <div className={styles.page}>
      {/* ── HERO TILE (Light) ── */}
      <section className="tile tile-light">
        <div className="tile-content">
          <div className={`${styles.heroHeader} animate-fade-up`}>
            <div>
              <h1 className={`t-hero ${styles.greeting}`}>
                {greeting}, {displayName} 👋
              </h1>
              <p className={`t-caption ${styles.dateStr}`}>{dateStr}</p>
            </div>
            <Link href="/log" id="hero-log-btn" className="btn-primary hide-mobile">
              + Log Meal
            </Link>
          </div>

          {/* Stats row */}
          <div className={`${styles.statsGrid} animate-fade-up delay-1`}>
            {/* Calorie ring */}
            <div className={styles.calorieCard}>
              <CalorieRing pct={calPct} consumed={totals.calories} goal={calGoal} />
              <div className={styles.calorieInfo}>
                <p className="t-tagline">{Math.round(calRemaining)}</p>
                <p className="t-caption" style={{ color: 'var(--ink-muted-48)' }}>kcal remaining</p>
                <div className={styles.calDetails}>
                  <span className="t-fine">🔥 {Math.round(totals.calories)} eaten</span>
                  <span className="t-fine">🎯 {calGoal} goal</span>
                </div>
              </div>
            </div>

            {/* Macro bars */}
            <div className={styles.macroCard}>
              <h2 className="t-caption-strong" style={{ marginBottom: 'var(--space-md)' }}>Macros Today</h2>
              <div className={styles.macroBars}>
                <MacroBar label="Protein" value={totals.protein_g} goal={proteinGoal} unit="g" color="protein" />
                <MacroBar label="Carbs"   value={totals.carbs_g}   goal={carbsGoal}  unit="g" color="carbs" />
                <MacroBar label="Fat"     value={totals.fat_g}     goal={fatGoal}    unit="g" color="fat" />
                <MacroBar label="Fiber"   value={totals.fiber_g}   goal={fiberGoal}  unit="g" color="fiber" />
              </div>
              <div style={{ marginTop: 'var(--space-md)' }}>
                <MacroPieChart protein={totals.protein_g} carbs={totals.carbs_g} fat={totals.fat_g} />
              </div>
            </div>

            {/* Water */}
            <div className={styles.waterCard}>
              <h2 className="t-caption-strong" style={{ marginBottom: 'var(--space-md)' }}>Hydration</h2>
              <div className={styles.waterGlasses}>
                {Array.from({ length: waterGoal }).map((_, i) => (
                  <button
                    key={i}
                    id={`water-glass-${i}`}
                    onClick={i < waterCount ? removeWater : addWater}
                    className={`${styles.glassBtn} ${i < waterCount ? styles.glassFull : styles.glassEmpty}`}
                    title={i < waterCount ? 'Remove glass' : 'Add glass'}
                    disabled={isAddingWater}
                  >
                    💧
                  </button>
                ))}
              </div>
              <p className="t-caption" style={{ color: 'var(--ink-muted-48)', marginTop: 'var(--space-sm)' }}>
                {waterCount} / {waterGoal} glasses · {waterCount * 250}ml
              </p>
              <div className="progress-bar" style={{ marginTop: 'var(--space-sm)' }}>
                <div
                  className="progress-fill progress-fill-water"
                  style={{ width: `${Math.min((waterCount / waterGoal) * 100, 100)}%` }}
                />
              </div>
              <div className={styles.waterActions}>
                <button id="water-add-btn" onClick={addWater} disabled={isAddingWater} className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                  + Add Glass
                </button>
                {waterCount > 0 && (
                  <button id="water-remove-btn" onClick={removeWater} className="btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                    − Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MEALS TILE (Dark) ── */}
      <section className="tile tile-dark">
        <div className="tile-content">
          <div className={styles.mealsHeader}>
            <h2 className="t-display-md" style={{ color: 'var(--on-dark)' }}>Today&apos;s Meals</h2>
            <Link href="/log" id="meals-add-btn" className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
              + Add
            </Link>
          </div>

          {/* Meal type filter chips */}
          <div className={styles.mealFilter}>
            {['all', ...MEAL_TYPES].map(type => (
              <button
                key={type}
                id={`filter-${type}`}
                onClick={() => setActiveMeal(type)}
                className={`chip ${activeMeal === type ? 'chip-active' : ''}`}
                style={{
                  background: activeMeal === type ? 'rgba(41,151,255,0.15)' : 'rgba(255,255,255,0.08)',
                  borderColor: activeMeal === type ? 'var(--primary-on-dark)' : 'rgba(255,255,255,0.15)',
                  color: activeMeal === type ? 'var(--primary-on-dark)' : 'var(--body-muted)',
                }}
              >
                {getMealEmoji(type)} {capitalize(type)}
                {type !== 'all' && (
                  <span style={{ opacity: 0.7, marginLeft: '4px' }}>
                    ({logsByMeal[type as keyof typeof logsByMeal]?.length || 0})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Log entries */}
          {filteredLogs.length === 0 ? (
            <div className={styles.emptyState}>
              <p style={{ fontSize: '48px' }}>🍽️</p>
              <p className="t-body-strong" style={{ color: 'var(--on-dark)' }}>Nothing logged yet</p>
              <p className="t-caption" style={{ color: 'var(--body-muted)' }}>
                {activeMeal === 'all' ? 'Start tracking your meals for today' : `No ${activeMeal} logged yet`}
              </p>
              <Link href="/log" id="empty-log-btn" className="btn-primary" style={{ marginTop: 'var(--space-md)' }}>
                Log a Meal
              </Link>
            </div>
          ) : (
            <div className={styles.logList}>
              {filteredLogs.map((log, i) => (
                <div key={log.id} className={`${styles.logEntry} animate-fade-up`} style={{ animationDelay: `${i * 40}ms` }}>
                  <div className={styles.logLeft}>
                    <div className={`meal-dot meal-dot-${log.meal_type}`} />
                    <div>
                      <p className="t-body-strong" style={{ color: 'var(--on-dark)' }}>{log.food_name}</p>
                      <p className="t-caption" style={{ color: 'var(--body-muted)' }}>
                        {log.quantity_g}g · {capitalize(log.meal_type)}
                        {log.ai_generated && <span className={styles.aiBadge}>✨ AI</span>}
                      </p>
                    </div>
                  </div>
                  <div className={styles.logRight}>
                    <p className="t-body-strong" style={{ color: 'var(--on-dark)' }}>{Math.round(log.calories)} kcal</p>
                    <p className="t-fine" style={{ color: 'var(--body-muted)' }}>
                      P:{Math.round(log.protein_g)}g C:{Math.round(log.carbs_g)}g F:{Math.round(log.fat_g)}g
                    </p>
                    <button
                      id={`delete-log-${log.id}`}
                      onClick={() => deleteLog(log.id)}
                      disabled={deletingId === log.id}
                      className={styles.deleteBtn}
                      title="Delete entry"
                    >
                      {deletingId === log.id ? '···' : '×'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── AI TILE (Light Parchment) ── */}
      <section className="tile tile-parchment">
        <div className="tile-content text-center">
          <h2 className="t-display-md" style={{ marginBottom: 'var(--space-md)' }}>AI Food Assistant</h2>
          <p className="t-body" style={{ color: 'var(--ink-muted-48)', marginBottom: 'var(--space-xl)' }}>
            Describe what you ate in plain language. Groq AI will instantly calculate the nutrition for you.
          </p>
          <AIQuickInput userId={userId} today={today} onLogged={() => router.refresh()} />
        </div>
      </section>

      {/* ── WEEK CHART TILE (Dark) ── */}
      <section className="tile tile-dark-2">
        <div className="tile-content">
          <h2 className="t-display-md" style={{ color: 'var(--on-dark)', marginBottom: 'var(--space-xl)' }}>
            Week at a Glance
          </h2>
          <WeekChart data={weekData} calorieGoal={calGoal} />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className="container">
          <p className="t-fine" style={{ color: 'var(--ink-muted-48)' }}>
            NutriTrack · Powered by Groq AI · Data stored securely in Supabase
          </p>
        </div>
      </footer>
    </div>
  )
}

// ── Sub-components ──

function CalorieRing({ pct, consumed, goal }: { pct: number; consumed: number; goal: number }) {
  const r = 52
  const circumference = 2 * Math.PI * r
  const dash = (pct / 100) * circumference
  const color = pct >= 100 ? '#ff3b30' : pct >= 85 ? '#ff9500' : '#0066cc'

  return (
    <div className={styles.ringWrapper}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--hairline)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={circumference / 4}
          style={{ transition: 'stroke-dasharray 800ms cubic-bezier(0.34,1.56,0.64,1), stroke 400ms ease' }}
        />
      </svg>
      <div className={styles.ringCenter}>
        <span className="t-tagline">{Math.round(consumed)}</span>
        <span className="t-fine" style={{ color: 'var(--ink-muted-48)' }}>/ {goal} kcal</span>
      </div>
    </div>
  )
}

function MacroBar({ label, value, goal, unit, color }: {
  label: string; value: number; goal: number; unit: string; color: string
}) {
  const pct = Math.min((value / goal) * 100, 100)
  return (
    <div className={styles.macroBarRow}>
      <div className={styles.macroBarLabel}>
        <span className="t-caption-strong">{label}</span>
        <span className="t-caption" style={{ color: 'var(--ink-muted-48)' }}>
          {Math.round(value)}{unit} / {goal}{unit}
        </span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill progress-fill-${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function AIQuickInput({ userId, today, onLogged }: { userId: string; today: string; onLogged: () => void }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ name: string; calories: number; protein: number; carbs: number; fat: number } | null>(null)
  const [mealType, setMealType] = useState<string>('lunch')
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  async function analyzeFood(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    setResult(null)
    setSaved(false)
    try {
      const res = await fetch('/api/ai/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text, mealType }),
      })
      const data = await res.json()
      if (data.result) setResult(data.result)
    } catch { /* silent */ }
    setLoading(false)
  }

  async function saveToLog() {
    if (!result) return
    setSaved(true)
    await supabase.from('food_logs').insert({
      user_id: userId,
      food_name: result.name,
      logged_date: today,
      meal_type: mealType,
      quantity_g: 100,
      calories: result.calories,
      protein_g: result.protein,
      carbs_g: result.carbs,
      fat_g: result.fat,
      fiber_g: 0,
      ai_generated: true,
    })
    setText('')
    setResult(null)
    onLogged()
  }

  return (
    <div className={styles.aiInput}>
      <form onSubmit={analyzeFood} className={styles.aiForm}>
        <input
          id="ai-food-input"
          type="text"
          className="input"
          placeholder='Try: "2 rotis with dal and a glass of milk" ...'
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ flex: 1 }}
        />
        <select
          id="ai-meal-type"
          className="select"
          value={mealType}
          onChange={e => setMealType(e.target.value)}
          style={{ width: '140px', borderRadius: 'var(--radius-pill)', height: '44px' }}
        >
          {MEAL_TYPES.map(t => (
            <option key={t} value={t}>{capitalize(t)}</option>
          ))}
        </select>
        <button id="ai-analyze-btn" type="submit" className="btn-primary" disabled={loading || !text.trim()}>
          {loading ? <span className="animate-spin" style={{ display:'inline-block' }}>⟳</span> : '✨ Analyze'}
        </button>
      </form>

      {result && (
        <div className={`${styles.aiResult} animate-fade-up`}>
          <div className={styles.aiResultHeader}>
            <div>
              <p className="t-body-strong">{result.name}</p>
              <p className="t-caption" style={{ color: 'var(--ink-muted-48)' }}>AI estimated values</p>
            </div>
            <p className="t-tagline" style={{ color: 'var(--primary)' }}>{result.calories} kcal</p>
          </div>
          <div className={styles.aiResultMacros}>
            <div className={styles.aiMacroChip}>
              <span className="t-caption-strong" style={{ color: '#4CAF50' }}>{result.protein}g</span>
              <span className="t-fine">Protein</span>
            </div>
            <div className={styles.aiMacroChip}>
              <span className="t-caption-strong" style={{ color: '#FF9800' }}>{result.carbs}g</span>
              <span className="t-fine">Carbs</span>
            </div>
            <div className={styles.aiMacroChip}>
              <span className="t-caption-strong" style={{ color: '#E91E63' }}>{result.fat}g</span>
              <span className="t-fine">Fat</span>
            </div>
          </div>
          <button id="ai-save-btn" onClick={saveToLog} disabled={saved} className="btn-primary" style={{ marginTop: 'var(--space-sm)' }}>
            {saved ? '✓ Saved to Log' : '+ Add to Today\'s Log'}
          </button>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function getMealEmoji(type: string) {
  const e: Record<string, string> = { all: '📋', breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }
  return e[type] || '🍽️'
}
