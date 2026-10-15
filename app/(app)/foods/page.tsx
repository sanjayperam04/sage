import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function FoodsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: foods } = await supabase
    .from('foods')
    .select('*')
    .or(`is_global.eq.true,user_id.eq.${user.id}`)
    .order('name')

  const globalFoods = foods?.filter(f => f.is_global) || []
  const customFoods = foods?.filter(f => !f.is_global && f.user_id === user.id) || []

  return (
    <div>
      <section className="tile tile-dark">
        <div className="tile-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-lg)' }}>
            <div>
              <h1 className="t-display-md" style={{ color: 'var(--on-dark)', marginBottom: 'var(--space-sm)' }}>Foods</h1>
              <p className="t-caption" style={{ color: 'var(--body-muted)' }}>
                {globalFoods.length} foods in database · {customFoods.length} custom
              </p>
            </div>
            <Link href="/foods/custom" className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
              + Custom Food
            </Link>
          </div>
        </div>
      </section>

      <section className="tile tile-parchment">
        <div className="tile-content">
          {customFoods.length > 0 && (
            <div style={{ marginBottom: 'var(--space-xxl)' }}>
              <h2 className="t-tagline" style={{ marginBottom: 'var(--space-lg)' }}>My Custom Foods</h2>
              <FoodGrid foods={customFoods} />
            </div>
          )}

          <h2 className="t-tagline" style={{ marginBottom: 'var(--space-lg)' }}>Food Database</h2>
          <FoodGrid foods={globalFoods} />
        </div>
      </section>
    </div>
  )
}

function FoodGrid({ foods }: { foods: { id: string; name: string; calories_per_100g: number; protein_per_100g: number; carbs_per_100g: number; fat_per_100g: number; default_serving_g: number; serving_description: string | null }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
      {foods.map(food => (
        <div key={food.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <p className="t-body-strong">{food.name}</p>
          <p className="t-caption" style={{ color: 'var(--ink-muted-48)' }}>{food.serving_description || `${food.default_serving_g}g`}</p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xs)', flexWrap: 'wrap' }}>
            <div>
              <p className="t-caption-strong" style={{ color: 'var(--primary)' }}>
                {Math.round(food.calories_per_100g * food.default_serving_g / 100)}
              </p>
              <p className="t-fine" style={{ color: 'var(--ink-muted-48)' }}>kcal</p>
            </div>
            <div>
              <p className="t-caption-strong" style={{ color: '#4CAF50' }}>{food.protein_per_100g}g</p>
              <p className="t-fine" style={{ color: 'var(--ink-muted-48)' }}>protein</p>
            </div>
            <div>
              <p className="t-caption-strong" style={{ color: '#FF9800' }}>{food.carbs_per_100g}g</p>
              <p className="t-fine" style={{ color: 'var(--ink-muted-48)' }}>carbs</p>
            </div>
            <div>
              <p className="t-caption-strong" style={{ color: '#E91E63' }}>{food.fat_per_100g}g</p>
              <p className="t-fine" style={{ color: 'var(--ink-muted-48)' }}>fat</p>
            </div>
          </div>
          <p className="t-fine" style={{ color: 'var(--ink-muted-48)', marginTop: '4px' }}>Per 100g serving</p>
        </div>
      ))}
    </div>
  )
}
