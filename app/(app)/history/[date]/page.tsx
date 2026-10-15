import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

export default async function HistoryDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound()

  const [profileRes, logsRes] = await Promise.all([
    supabase.from('profiles').select('daily_calorie_goal, daily_protein_goal, daily_carbs_goal, daily_fat_goal').eq('id', user.id).single(),
    supabase.from('food_logs').select('*').eq('user_id', user.id).eq('logged_date', date).order('created_at'),
  ])

  const profile = profileRes.data || { daily_calorie_goal: 2200, daily_protein_goal: 160, daily_carbs_goal: 250, daily_fat_goal: 70 }
  const logs = logsRes.data || []

  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      protein_g: acc.protein_g + (log.protein_g || 0),
      carbs_g: acc.carbs_g + (log.carbs_g || 0),
      fat_g: acc.fat_g + (log.fat_g || 0),
      fiber_g: acc.fiber_g + (log.fiber_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  )

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const isToday = date === new Date().toISOString().split('T')[0]

  return (
    <div>
      <section className="tile tile-dark">
        <div className="tile-content">
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <Link href="/history" style={{ color: 'var(--primary-on-dark)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ← History
            </Link>
          </div>
          <h1 className="t-display-md" style={{ color: 'var(--on-dark)', marginBottom: 'var(--space-xs)' }}>
            {isToday ? 'Today' : displayDate}
          </h1>
          {!isToday && <p className="t-caption" style={{ color: 'var(--body-muted)' }}>{displayDate}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 'var(--space-md)', marginTop: 'var(--space-xxl)' }}>
            {[
              { label: 'Calories', value: Math.round(totals.calories), goal: profile.daily_calorie_goal, unit: 'kcal' },
              { label: 'Protein', value: Math.round(totals.protein_g), goal: profile.daily_protein_goal, unit: 'g' },
              { label: 'Carbs', value: Math.round(totals.carbs_g), goal: profile.daily_carbs_goal, unit: 'g' },
              { label: 'Fat', value: Math.round(totals.fat_g), goal: profile.daily_fat_goal, unit: 'g' },
              { label: 'Fiber', value: Math.round(totals.fiber_g), goal: 30, unit: 'g' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', textAlign: 'center' }}>
                <p className="t-tagline" style={{ color: 'var(--on-dark)' }}>{s.value}</p>
                <p className="t-fine" style={{ color: 'var(--body-muted)' }}>{s.unit} / {s.goal}</p>
                <p className="t-caption" style={{ color: 'var(--body-muted)', marginTop: '4px', fontSize: '12px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tile tile-parchment">
        <div className="tile-content">
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-section) 0' }}>
              <p style={{ fontSize: '48px' }}>📭</p>
              <p className="t-body-strong">Nothing was logged this day</p>
            </div>
          ) : (
            MEAL_TYPES.map(mealType => {
              const mealLogs = logs.filter(l => l.meal_type === mealType)
              if (mealLogs.length === 0) return null
              const mealCals = mealLogs.reduce((s, l) => s + (l.calories || 0), 0)
              return (
                <div key={mealType} style={{ marginBottom: 'var(--space-xxl)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <h2 className="t-tagline">{getMealEmoji(mealType)} {capitalize(mealType)}</h2>
                    <span className="t-caption-strong" style={{ color: 'var(--ink-muted-48)' }}>{Math.round(mealCals)} kcal</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    {mealLogs.map(log => (
                      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--canvas)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)' }}>
                        <div>
                          <p className="t-body-strong">{log.food_name}</p>
                          <p className="t-caption" style={{ color: 'var(--ink-muted-48)' }}>{log.quantity_g}g</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p className="t-body-strong">{Math.round(log.calories)} kcal</p>
                          <p className="t-fine" style={{ color: 'var(--ink-muted-48)' }}>P:{Math.round(log.protein_g)}g C:{Math.round(log.carbs_g)}g F:{Math.round(log.fat_g)}g</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
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
