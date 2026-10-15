'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, WeightLog } from '@/lib/types'
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
  }, [])

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
      {/* Header */}
      <section className="tile tile-dark">
        <div className="tile-content">
          <h1 className="t-display-md" style={{ color: 'var(--on-dark)', marginBottom: 'var(--space-xs)' }}>Profile & Goals</h1>
          <p className="t-caption" style={{ color: 'var(--body-muted)' }}>Customize your daily nutrition targets</p>
        </div>
      </section>

      <section className="tile tile-parchment">
        <div className="tile-content-wide">
          <div className={styles.twoCol}>
            {/* Goals form */}
            <div>
              <h2 className="t-tagline" style={{ marginBottom: 'var(--space-xl)' }}>Daily Goals</h2>
              <form onSubmit={saveProfile} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="profile-name" className="label">Display Name</label>
                  <input id="profile-name" type="text" className="input-rect" value={profile.display_name || ''} onChange={up('display_name')} placeholder="Your name" />
                </div>

                <hr className="divider" />
                <p className="t-caption-strong" style={{ color: 'var(--ink-muted-48)' }}>NUTRITION GOALS</p>

                <div className={styles.goalGrid}>
                  {[
                    { id: 'goal-calories', label: 'Calories (kcal)', key: 'daily_calorie_goal' as keyof Profile, min: 1000, max: 5000, step: 50, color: '#0066cc' },
                    { id: 'goal-protein', label: 'Protein (g)', key: 'daily_protein_goal' as keyof Profile, min: 20, max: 400, step: 5, color: '#4CAF50' },
                    { id: 'goal-carbs', label: 'Carbs (g)', key: 'daily_carbs_goal' as keyof Profile, min: 20, max: 600, step: 5, color: '#FF9800' },
                    { id: 'goal-fat', label: 'Fat (g)', key: 'daily_fat_goal' as keyof Profile, min: 10, max: 300, step: 5, color: '#E91E63' },
                    { id: 'goal-fiber', label: 'Fiber (g)', key: 'daily_fiber_goal' as keyof Profile, min: 5, max: 80, step: 1, color: '#9C27B0' },
                    { id: 'goal-water', label: 'Water (glasses)', key: 'daily_water_goal' as keyof Profile, min: 2, max: 20, step: 1, color: '#2196F3' },
                  ].map(g => (
                    <div key={g.key} className={styles.field}>
                      <label htmlFor={g.id} className="label">{g.label}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <input
                          id={g.id}
                          type="number"
                          className="input-rect"
                          value={(profile[g.key] as number) || 0}
                          onChange={up(g.key)}
                          min={g.min}
                          max={g.max}
                          step={g.step}
                          style={{ flex: 1 }}
                        />
                        <span className="t-caption-strong" style={{ color: g.color, minWidth: '40px' }}>
                          {(profile[g.key] as number) || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.field}>
                  <label htmlFor="weight-unit" className="label">Weight Unit</label>
                  <select id="weight-unit" className="select" value={profile.weight_unit || 'kg'} onChange={up('weight_unit')}>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="lbs">Pounds (lbs)</option>
                  </select>
                </div>

                <button id="profile-save-btn" type="submit" className="btn-primary" disabled={loading}>
                  {saved ? '✓ Saved!' : loading ? 'Saving...' : 'Save Goals'}
                </button>
              </form>
            </div>

            {/* Weight log */}
            <div>
              <h2 className="t-tagline" style={{ marginBottom: 'var(--space-xl)' }}>Weight Log</h2>

              <div className={styles.weightInput}>
                <input
                  id="weight-value"
                  type="number"
                  className="input-rect"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  placeholder={`Today's weight (${profile.weight_unit || 'kg'})`}
                  min="20"
                  max="300"
                  step="0.1"
                  style={{ flex: 1 }}
                />
                <button id="weight-log-btn" onClick={logWeight} disabled={weightLoading || !newWeight} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  {weightLoading ? '...' : 'Log Weight'}
                </button>
              </div>

              {weightLogs.length === 0 ? (
                <p className="t-caption" style={{ color: 'var(--ink-muted-48)', marginTop: 'var(--space-lg)' }}>
                  No weight entries yet. Log your first today!
                </p>
              ) : (
                <div className={styles.weightList}>
                  <div className={styles.weightTrend}>
                    {weightLogs.length >= 2 && (
                      <div className={styles.trendBadge} style={{
                        background: weightLogs[0].weight_kg < weightLogs[1].weight_kg ? '#f0fff4' : '#fff2f2',
                        color: weightLogs[0].weight_kg < weightLogs[1].weight_kg ? '#1a7f3c' : '#c00',
                        border: `1px solid ${weightLogs[0].weight_kg < weightLogs[1].weight_kg ? '#b7f5ca' : '#fcc'}`,
                      }}>
                        {weightLogs[0].weight_kg < weightLogs[1].weight_kg ? '▼' : '▲'}{' '}
                        {Math.abs(weightLogs[0].weight_kg - weightLogs[1].weight_kg).toFixed(1)}{profile.weight_unit || 'kg'} vs last entry
                      </div>
                    )}
                  </div>
                  {weightLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className={styles.weightEntry}>
                      <span className="t-caption" style={{ color: 'var(--ink-muted-48)' }}>
                        {new Date(log.logged_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="t-body-strong">{log.weight_kg} {profile.weight_unit || 'kg'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
