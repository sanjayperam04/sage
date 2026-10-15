import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, ChevronRight, Activity, ArrowLeft } from 'lucide-react'
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
      <div className="container">
        {/* Header */}
        <header style={{ marginBottom: 'var(--space-lg)', paddingTop: 'var(--space-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-xs)' }}>
            <Link href="/dashboard" style={{ color: 'var(--ink-muted-80)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
          <h1 className="t-display-md">Nutrition Logbook</h1>
          <p className="t-caption" style={{ color: 'var(--ink-muted-80)' }}>Historical telemetry from the last 30 days</p>
        </header>

        {/* Summary Metric Strip */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span className={`${styles.summaryVal} tabular`}>{avgCalories} kcal</span>
            <span className={styles.summaryLabel}>Avg Daily Calories</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={`${styles.summaryVal} tabular`}>{daysOnTarget} / {dates.length || 0}</span>
            <span className={styles.summaryLabel}>Days on Target</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={`${styles.summaryVal} tabular`}>{logs.length}</span>
            <span className={styles.summaryLabel}>Meals Recorded</span>
          </div>
        </div>

        {/* Days List */}
        {dates.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xxl) var(--space-md)' }}>
            <Calendar size={36} strokeWidth={1.5} color="var(--ink-muted-48)" style={{ marginBottom: 'var(--space-sm)' }} />
            <p className="t-body-strong">No past days on record</p>
            <p className="t-caption" style={{ color: 'var(--ink-muted-48)', marginTop: '4px', marginBottom: 'var(--space-md)' }}>
              Log your meals today to establish your performance baseline.
            </p>
            <Link href="/log" className="btn-primary" style={{ fontSize: '13px', padding: '10px 18px' }}>
              Log First Meal
            </Link>
          </div>
        ) : (
          <div className={styles.dayList}>
            {dates.map(([dateStr, data]) => {
              const d = new Date(dateStr + 'T00:00:00')
              const isCurrentDay = dateStr === today
              const label = isCurrentDay
                ? 'Today'
                : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

              return (
                <Link key={dateStr} href={`/history/${dateStr}`} className={styles.dayCard}>
                  <div className={styles.dayLeft}>
                    <p className={styles.dayTitle}>{label}</p>
                    <div className={styles.dayMacros}>
                      <span className="tabular" style={{ color: '#FFFFFF', fontWeight: 600 }}>{Math.round(data.protein_g)}g P</span>
                      <span>·</span>
                      <span className="tabular">{Math.round(data.carbs_g)}g C</span>
                      <span>·</span>
                      <span className="tabular">{Math.round(data.fat_g)}g F</span>
                      <span>·</span>
                      <span>{data.count} meals</span>
                    </div>
                  </div>

                  <div className={styles.dayRight}>
                    <div>
                      <p className={`${styles.dayCalValue} tabular`}>{Math.round(data.calories)}</p>
                      <p className={styles.dayCalUnit}>kcal</p>
                    </div>
                    <ChevronRight size={16} strokeWidth={2} color="var(--ink-muted-48)" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
