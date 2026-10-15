'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, WeightLog } from '@/lib/types'
import { Target, Scale, Check, TrendingDown, TrendingUp, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import styles from './profile.module.css'

export default function ProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Partial<Profile>>({
    display_name: '',
    daily_calorie_goal: 2200,
    daily_protein_goal: 160,
    daily_carbs_goal: 250,
    daily_fat_goal: 70,
    daily_fiber_goal: 30,
    daily_water_goal: 8,
    weight_unit: 'kg',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])
  const [newWeight, setNewWeight] = useState('')
  const [weightLoading, setWeightLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
      const { data: wlogs } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_date', { ascending: false })
        .limit(30)
      setWeightLogs(wlogs || [])
    })
  }, [supabase])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('profiles').upsert({ id: userId, ...profile, updated_at: new Date().toISOString() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setLoading(false)
  }

  async function logWeight() {
    if (!newWeight || !userId) return
    setWeightLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('weight_logs').insert({
      user_id: userId,
      logged_date: today,
      weight_kg: parseFloat(newWeight),
    }).select().single()
    if (data) {
      setWeightLogs(prev => [data, ...prev.filter(l => l.logged_date !== today)])
      setNewWeight('')
    }
    setWeightLoading(false)
  }

  const up = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setProfile(p => ({ ...p, [key]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value }))

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
          <h1 className="t-display-md">Athlete Architecture</h1>
          <p className="t-caption" style={{ color: 'var(--ink-muted-80)' }}>Calibrate nutrition targets & weight telemetry</p>
        </header>

        <div className={styles.twoCol}>
          {/* Goals form */}
          <section className={styles.cardSection}>
            <h2 className={styles.sectionTitle}>
              <Target size={16} strokeWidth={2.4} color="var(--primary)" />
              Daily Fuel Targets
            </h2>

            <form onSubmit={saveProfile} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="profile-name" className="label">Athlete Handle</label>
                <input
                  id="profile-name"
                  type="text"
                  className="input-rect"
                  value={profile.display_name || ''}
                  onChange={up('display_name')}
                  placeholder="e.g. Sanja"
                />
              </div>

              <div className="divider" />
              <p className="t-fine" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>Macronutrient Directives</p>

              <div className={styles.goalGrid}>
                {[
                  { id: 'goal-calories', label: 'Calories', key: 'daily_calorie_goal' as keyof Profile, min: 1000, max: 6000, step: 50, unit: 'kcal' },
                  { id: 'goal-protein', label: 'Protein', key: 'daily_protein_goal' as keyof Profile, min: 20, max: 400, step: 5, unit: 'g' },
                  { id: 'goal-carbs', label: 'Carbohydrates', key: 'daily_carbs_goal' as keyof Profile, min: 20, max: 700, step: 5, unit: 'g' },
                  { id: 'goal-fat', label: 'Fats', key: 'daily_fat_goal' as keyof Profile, min: 10, max: 300, step: 5, unit: 'g' },
                  { id: 'goal-fiber', label: 'Fiber', key: 'daily_fiber_goal' as keyof Profile, min: 5, max: 80, step: 1, unit: 'g' },
                  { id: 'goal-water', label: 'Hydration Target', key: 'daily_water_goal' as keyof Profile, min: 2, max: 20, step: 1, unit: 'glasses' },
                ].map(g => (
                  <div key={g.key} className={styles.field}>
                    <label htmlFor={g.id} className="label">{g.label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        id={g.id}
                        type="number"
                        className="input-rect tabular"
                        value={(profile[g.key] as number) || 0}
                        onChange={up(g.key)}
                        min={g.min}
                        max={g.max}
                        step={g.step}
                        style={{ flex: 1 }}
                      />
                      <span className="tabular" style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '13px', minWidth: '40px' }}>
                        {(profile[g.key] as number) || 0}{g.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.field}>
                <label htmlFor="weight-unit" className="label">Unit of Measure</label>
                <select id="weight-unit" className="select" value={profile.weight_unit || 'kg'} onChange={up('weight_unit')}>
                  <option value="kg">Metric (Kilograms - kg)</option>
                  <option value="lbs">Imperial (Pounds - lbs)</option>
                </select>
              </div>

              <button id="profile-save-btn" type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                {saved ? '✓ Targets Locked' : loading ? 'Saving...' : 'Lock In Targets'}
              </button>
            </form>
          </section>

          {/* Weight Log */}
          <section className={styles.cardSection}>
            <h2 className={styles.sectionTitle}>
              <Scale size={16} strokeWidth={2.4} color="var(--primary)" />
              Bodyweight Log
            </h2>

            <div className={styles.weightInputRow}>
              <input
                id="weight-value"
                type="number"
                className="input-rect tabular"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                placeholder={`Today's weight (${profile.weight_unit || 'kg'})`}
                min="20"
                max="300"
                step="0.1"
                style={{ flex: 1 }}
              />
              <button
                id="weight-log-btn"
                onClick={logWeight}
                disabled={weightLoading || !newWeight}
                className="btn-primary"
                style={{ whiteSpace: 'nowrap', minHeight: '46px' }}
              >
                {weightLoading ? '...' : 'Log'}
              </button>
            </div>

            {weightLogs.length === 0 ? (
              <p className="t-caption" style={{ color: 'var(--ink-muted-48)', textAlign: 'center', padding: 'var(--space-lg) 0' }}>
                No weight logs yet. Record your morning weight to track trend delta.
              </p>
            ) : (
              <div className={styles.weightList}>
                {weightLogs.length >= 2 && (
                  <div
                    className={styles.trendBadge}
                    style={{
                      background: weightLogs[0].weight_kg < weightLogs[1].weight_kg ? 'rgba(48, 209, 88, 0.12)' : 'rgba(255, 69, 58, 0.12)',
                      color: weightLogs[0].weight_kg < weightLogs[1].weight_kg ? 'var(--primary)' : 'var(--macro-fat)',
                      border: `1px solid ${weightLogs[0].weight_kg < weightLogs[1].weight_kg ? 'rgba(48, 209, 88, 0.25)' : 'rgba(255, 69, 58, 0.25)'}`,
                    }}
                  >
                    {weightLogs[0].weight_kg < weightLogs[1].weight_kg ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                    <span>
                      {Math.abs(weightLogs[0].weight_kg - weightLogs[1].weight_kg).toFixed(1)} {profile.weight_unit || 'kg'} vs previous check-in
                    </span>
                  </div>
                )}

                {weightLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className={styles.weightEntry}>
                    <span className="t-caption" style={{ color: 'var(--ink-muted-80)' }}>
                      {new Date(log.logged_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="t-body-strong tabular">{log.weight_kg} {profile.weight_unit || 'kg'}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
