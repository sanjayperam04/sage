import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Plus, Sparkles, ArrowLeft } from 'lucide-react'

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
    <div style={{ minHeight: '100vh', paddingBottom: 'var(--space-xxl)' }}>
      <div className="container">
        {/* Header */}
        <header style={{ marginBottom: 'var(--space-lg)', paddingTop: 'var(--space-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-xs)' }}>
              <Link href="/dashboard" style={{ color: 'var(--ink-muted-80)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                <ArrowLeft size={14} /> Back
              </Link>
            </div>
            <h1 className="t-display-md">Food Catalog</h1>
            <p className="t-caption" style={{ color: 'var(--ink-muted-80)' }}>
              {customFoods.length} custom athlete foods saved
            </p>
          </div>
          <Link href="/foods/custom" className="btn-primary" style={{ fontSize: '13px', padding: '10px 18px', minHeight: '40px' }}>
            <Plus size={15} strokeWidth={2.4} />
            <span>Add Custom</span>
          </Link>
        </header>

        {customFoods.length > 0 && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 className="t-tagline" style={{ marginBottom: 'var(--space-md)' }}>My Custom Foods</h2>
            <FoodGrid foods={customFoods} />
          </div>
        )}

        {globalFoods.length > 0 ? (
          <div>
            <h2 className="t-tagline" style={{ marginBottom: 'var(--space-md)' }}>Global Database</h2>
            <FoodGrid foods={globalFoods} />
          </div>
        ) : customFoods.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xxl) var(--space-md)' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              background: '#1A1A1A',
              border: '1px solid #333333',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-md)',
            }}>
              <Sparkles size={26} strokeWidth={2.2} />
            </div>
            <h2 className="t-tagline" style={{ marginBottom: 'var(--space-xs)' }}>AI Dynamic Nutrition</h2>
            <p className="t-caption" style={{ color: 'var(--ink-muted-80)', maxWidth: '440px', margin: '0 auto var(--space-lg)' }}>
              Sage dynamically parses natural meal descriptions in real-time. You can also save persistent custom fitness staples to your catalog.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/log" className="btn-primary">
                <Sparkles size={14} strokeWidth={2.2} />
                <span>Log Meal with AI</span>
              </Link>
              <Link href="/foods/custom" className="btn-secondary">
                <Plus size={14} strokeWidth={2.2} />
                <span>Create Custom Food</span>
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function FoodGrid({ foods }: { foods: { id: string; name: string; calories_per_100g: number; protein_per_100g: number; carbs_per_100g: number; fat_per_100g: number; default_serving_g: number; serving_description: string | null }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-sm)' }}>
      {foods.map(food => (
        <div key={food.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p className="t-body-strong">{food.name}</p>
          <p className="t-fine" style={{ color: 'var(--ink-muted-80)' }}>{food.serving_description || `${food.default_serving_g}g serving`}</p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xs)', alignItems: 'center' }}>
            <div>
              <p className="tabular" style={{ fontWeight: 700, fontSize: '15px' }}>
                {Math.round(food.calories_per_100g * food.default_serving_g / 100)}
              </p>
              <p className="t-fine">kcal</p>
            </div>
            <div>
              <p className="tabular" style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '15px' }}>{food.protein_per_100g}g</p>
              <p className="t-fine">protein</p>
            </div>
            <div>
              <p className="tabular" style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '15px' }}>{food.carbs_per_100g}g</p>
              <p className="t-fine">carbs</p>
            </div>
            <div>
              <p className="tabular" style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '15px' }}>{food.fat_per_100g}g</p>
              <p className="t-fine">fat</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
