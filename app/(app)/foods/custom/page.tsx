'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

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
  }, [supabase])

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
    <div style={{ minHeight: '100vh', paddingBottom: 'var(--space-xxl)' }}>
      <div className="container" style={{ maxWidth: '640px' }}>
        <header style={{ marginBottom: 'var(--space-lg)', paddingTop: 'var(--space-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-xs)' }}>
            <Link href="/foods" style={{ color: 'var(--ink-muted-80)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
          <h1 className="t-display-md">Create Custom Food</h1>
          <p className="t-caption" style={{ color: 'var(--ink-muted-80)' }}>
            Nutritional density per 100g standard serving
          </p>
        </header>

        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <label className="label">Food Name *</label>
            <input
              type="text"
              required
              className="input-rect"
              placeholder="e.g. Greek Yogurt 0% Fat"
              value={form.name}
              onChange={f('name')}
            />
          </div>

          <div>
            <label className="label">Brand / Source (Optional)</label>
            <input
              type="text"
              className="input-rect"
              placeholder="e.g. Epigamia, Homemade"
              value={form.brand}
              onChange={f('brand')}
            />
          </div>

          <div className="divider" />
          <p className="t-fine" style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>Macros per 100g</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
            <div>
              <label className="label">Calories (kcal) *</label>
              <input
                type="number"
                required
                className="input-rect tabular"
                placeholder="0"
                value={form.calories}
                onChange={f('calories')}
              />
            </div>
            <div>
              <label className="label">Protein (g) *</label>
              <input
                type="number"
                step="0.1"
                required
                className="input-rect tabular"
                placeholder="0"
                value={form.protein}
                onChange={f('protein')}
              />
            </div>
            <div>
              <label className="label">Carbohydrates (g)</label>
              <input
                type="number"
                step="0.1"
                className="input-rect tabular"
                placeholder="0"
                value={form.carbs}
                onChange={f('carbs')}
              />
            </div>
            <div>
              <label className="label">Fat (g)</label>
              <input
                type="number"
                step="0.1"
                className="input-rect tabular"
                placeholder="0"
                value={form.fat}
                onChange={f('fat')}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
            <div>
              <label className="label">Default Serving (g)</label>
              <input
                type="number"
                className="input-rect tabular"
                placeholder="100"
                value={form.default_serving_g}
                onChange={f('default_serving_g')}
              />
            </div>
            <div>
              <label className="label">Portion Label</label>
              <input
                type="text"
                className="input-rect"
                placeholder="e.g. 1 cup, 1 scoop"
                value={form.serving_description}
                onChange={f('serving_description')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: 'var(--space-xs)' }}
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>{loading ? 'Saving...' : 'Save to Food Catalog'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
