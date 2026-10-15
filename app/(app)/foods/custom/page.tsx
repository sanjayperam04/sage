'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function CustomFoodPage() {
  const [form, setForm] = useState({
    name: '', brand: '', calories: '', protein: '', carbs: '', fat: '', fiber: '',
    default_serving_g: '100', serving_description: ''
  })
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setLoading(true)
    const { error } = await supabase.from('foods').insert({
      user_id: userId,
      name: form.name,
      brand: form.brand || null,
      calories_per_100g: parseFloat(form.calories) || 0,
      protein_per_100g: parseFloat(form.protein) || 0,
      carbs_per_100g: parseFloat(form.carbs) || 0,
      fat_per_100g: parseFloat(form.fat) || 0,
      fiber_per_100g: parseFloat(form.fiber) || 0,
      default_serving_g: parseFloat(form.default_serving_g) || 100,
      serving_description: form.serving_description || null,
      is_global: false,
    })
    if (!error) router.push('/foods')
    setLoading(false)
  }

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <div>
      <section className="tile tile-dark">
        <div className="tile-content">
          <Link href="/foods" style={{ color: 'var(--primary-on-dark)', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: 'var(--space-md)' }}>
            ← Foods
          </Link>
          <h1 className="t-display-md" style={{ color: 'var(--on-dark)' }}>Create Custom Food</h1>
          <p className="t-caption" style={{ color: 'var(--body-muted)', marginTop: 'var(--space-xs)' }}>
            Values per 100g serving
          </p>
        </div>
      </section>

      <section className="tile tile-parchment">
        <div className="tile-content" style={{ maxWidth: '560px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <label htmlFor="custom-food-name" className="label">Food Name *</label>
              <input id="custom-food-name" type="text" className="input-rect" value={form.name} onChange={f('name')} required placeholder="e.g. Protein Bar" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <label htmlFor="custom-food-brand" className="label">Brand (optional)</label>
              <input id="custom-food-brand" type="text" className="input-rect" value={form.brand} onChange={f('brand')} placeholder="e.g. MyProtein" />
            </div>

            <hr className="divider" />
            <p className="t-caption-strong" style={{ color: 'var(--ink-muted-48)' }}>NUTRITION PER 100G</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              {[
                { id: 'custom-calories', label: 'Calories (kcal) *', key: 'calories' as const },
                { id: 'custom-protein', label: 'Protein (g)', key: 'protein' as const },
                { id: 'custom-carbs', label: 'Carbs (g)', key: 'carbs' as const },
                { id: 'custom-fat', label: 'Fat (g)', key: 'fat' as const },
                { id: 'custom-fiber', label: 'Fiber (g)', key: 'fiber' as const },
                { id: 'custom-serving', label: 'Default serving (g)', key: 'default_serving_g' as const },
              ].map(({ id, label, key }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  <label htmlFor={id} className="label">{label}</label>
                  <input id={id} type="number" className="input-rect" value={form[key]} onChange={f(key)} min="0" step="0.1" required={key === 'calories'} placeholder="0" />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <label htmlFor="custom-serving-desc" className="label">Serving description (optional)</label>
              <input id="custom-serving-desc" type="text" className="input-rect" value={form.serving_description} onChange={f('serving_description')} placeholder='e.g. "1 bar (60g)"' />
            </div>

            <button id="custom-food-save" type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 'var(--space-sm)' }}>
              {loading ? 'Saving...' : 'Save Food'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
