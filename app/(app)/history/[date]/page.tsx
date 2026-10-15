import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Flame } from 'lucide-react'

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

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })

  const isToday = date === new Date().toISOString().split('T')[0]

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 'var(--space-xxl)' }}>
      <div className="container">
        {/* Header */}
        <header style={{ marginBottom: 'var(--space-lg)', paddingTop: 'var(--space-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-xs)' }}>
            <Link href="/history" style={{ color: 'var(--ink-muted-80)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
              <ArrowLeft size={14} /> History
            </Link>
          </div>
          <h1 className="t-display-md">{isToday ? 'Today' : displayDate}</h1>
          <p className="t-caption" style={{ color: 'var(--ink-muted-80)' }}>Telemetry report for {date}</p>
        </header>

        {/* Macro Summary Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
          {[
            { label: 'Calories', value: Math.round(totals.calories), goal: profile.daily_calorie_goal, unit: 'kcal' },
            { label: 'Protein', value: Math.round(totals.protein_g), goal: profile.daily_protein_goal, unit: 'g' },
            { label: 'Carbs', value: Math.round(totals.carbs_g), goal: profile.daily_carbs_goal, unit: 'g' },
            { label: 'Fat', value: Math.round(totals.fat_g), goal: profile.daily_fat_goal, unit: 'g' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: 'var(--space-md)' }}>
              <p className="tabular" style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>{s.value}</p>
              <p className="t-fine" style={{ marginTop: '2px' }}>{s.unit} of {s.goal}{s.unit} target</p>
              <p className="t-fine" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-muted-48)', marginTop: '4px' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Meal Logs by Category */}
        {logs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xxl) var(--space-md)' }}>
            <Calendar size={36} strokeWidth={1.5} color="var(--ink-muted-48)" style={{ marginBottom: 'var(--space-sm)' }} />
            <p className="t-body-strong">Zero records for this date</p>
            <p className="t-caption" style={{ color: 'var(--ink-muted-48)', marginTop: '4px' }}>
              No fuel entries were logged on {date}.
            </p>
          </div>
        ) : (
          MEAL_TYPES.map(mealType => {
            const mealLogs = logs.filter(l => l.meal_type === mealType)
            if (mealLogs.length === 0) return null
            const mealCals = mealLogs.reduce((s, l) => s + (l.calories || 0), 0)

            return (
              <div key={mealType} style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                  <h2 className="t-tagline" style={{ textTransform: 'capitalize' }}>{mealType}</h2>
                  <span className="t-fine tabular" style={{ color: 'var(--primary)', fontWeight: 600 }}>{Math.round(mealCals)} kcal</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {mealLogs.map(log => (
                    <div key={log.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md)' }}>
                      <div>
                        <p className="t-body-strong">{log.food_name}</p>
                        <p className="t-fine" style={{ color: 'var(--ink-muted-48)' }}>{log.quantity_g}g portion</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p className="tabular" style={{ fontWeight: 700, fontSize: '16px' }}>{Math.round(log.calories)} kcal</p>
                        <p className="t-fine tabular">
                          <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{Math.round(log.protein_g)}g P</span> · <span>{Math.round(log.carbs_g)}g C</span> · <span>{Math.round(log.fat_g)}g F</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
