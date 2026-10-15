import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './history.module.css'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const startDate = thirtyDaysAgo.toISOString().split('T')[0]

  const [profileRes, logsRes] = await Promise.all([
    supabase.from('profiles').select('daily_calorie_goal, daily_protein_goal').eq('id', user.id).single(),
    supabase
      .from('food_logs')
      .select('logged_date, calories, protein_g, carbs_g, fat_g')
      .eq('user_id', user.id)
      .gte('logged_date', startDate)
      .lte('logged_date', today)
      .order('logged_date', { ascending: false }),
  ])

  const calGoal = profileRes.data?.daily_calorie_goal || 2200
  const logs = logsRes.data || []

  // Group by date
  const byDate: Record<string, { calories: number; protein_g: number; carbs_g: number; fat_g: number; count: number }> = {}
  for (const log of logs) {
    if (!byDate[log.logged_date]) {
      byDate[log.logged_date] = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, count: 0 }
    }
    byDate[log.logged_date].calories += log.calories || 0
    byDate[log.logged_date].protein_g += log.protein_g || 0
    byDate[log.logged_date].carbs_g += log.carbs_g || 0
    byDate[log.logged_date].fat_g += log.fat_g || 0
    byDate[log.logged_date].count += 1
  }

  const dates = Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a))

  const avgCalories = dates.length > 0
    ? Math.round(dates.reduce((s, [, d]) => s + d.calories, 0) / dates.length)
    : 0

  const daysOnTarget = dates.filter(([, d]) => d.calories >= calGoal * 0.85 && d.calories <= calGoal * 1.1).length

  return (
    <div className={styles.page}>
      {/* Header */}
      <section className="tile tile-dark">
        <div className="tile-content">
          <h1 className="t-display-md" style={{ color: 'var(--on-dark)', marginBottom: 'var(--space-sm)' }}>History</h1>
          <p className="t-caption" style={{ color: 'var(--body-muted)', marginBottom: 'var(--space-xxl)' }}>Last 30 days</p>

          <div className={styles.summaryRow}>
            {[
              { label: 'Days Tracked', value: dates.length, suffix: 'days' },
              { label: 'Avg Calories', value: avgCalories, suffix: 'kcal' },
              { label: 'On Target', value: daysOnTarget, suffix: `/ ${dates.length}` },
            ].map(s => (
              <div key={s.label} className={styles.summaryCard}>
                <p className="t-display-md" style={{ color: 'var(--on-dark)' }}>{s.value}</p>
                <p className="t-fine" style={{ color: 'var(--body-muted)' }}>{s.suffix}</p>
                <p className="t-caption" style={{ color: 'var(--body-muted)', marginTop: '4px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Day list */}
      <section className="tile tile-parchment">
        <div className="tile-content">
          {dates.length === 0 ? (
            <div className={styles.empty}>
              <p style={{ fontSize: '64px' }}>📅</p>
              <h2 className="t-display-md">No history yet</h2>
              <p className="t-body" style={{ color: 'var(--ink-muted-48)' }}>Start logging your meals to see your history here.</p>
              <Link href="/log" className="btn-primary" style={{ marginTop: 'var(--space-lg)' }}>Log Your First Meal</Link>
            </div>
          ) : (
            <div className={styles.dayList}>
              {dates.map(([date, data], i) => {
                const pct = Math.min((data.calories / calGoal) * 100, 100)
                const isToday = date === today
                const isGood = data.calories >= calGoal * 0.85 && data.calories <= calGoal * 1.1
                const isOver = data.calories > calGoal * 1.1
                const statusColor = isOver ? '#ff3b30' : isGood ? '#34C759' : '#ff9500'

                return (
                  <Link
                    key={date}
                    href={`/history/${date}`}
                    className={`${styles.dayCard} animate-fade-up`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className={styles.dayLeft}>
                      <div>
                        <p className="t-body-strong" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isToday ? '📍 Today' : formatDate(date)}
                        </p>
                        <p className="t-caption" style={{ color: 'var(--ink-muted-48)' }}>
                          {data.count} entries · P:{Math.round(data.protein_g)}g C:{Math.round(data.carbs_g)}g F:{Math.round(data.fat_g)}g
                        </p>
                      </div>
                    </div>
                    <div className={styles.dayRight}>
                      <div className={styles.dayCalories}>
                        <p className="t-body-strong" style={{ color: statusColor }}>{Math.round(data.calories)}</p>
                        <p className="t-fine" style={{ color: 'var(--ink-muted-48)' }}>/ {calGoal} kcal</p>
                      </div>
                      <div className={styles.dayBar}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: statusColor }} />
                        </div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted-48)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
}
