'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import type { Profile, FoodLog } from '@/lib/types'
import { Plus, Trash2, Droplets, Minus, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react'
import styles from './dashboard.module.css'

const WeekChart = dynamic(() => import('@/components/WeekChart'), {
  ssr: false,
  loading: () => <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '12px' }}>Loading chart...</div>,
})

interface Props {
  profile: Profile
  todayLogs: FoodLog[]
  totals: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }
  waterGlasses: number
  weekData: { date: string; label: string; calories: number; protein: number }[]
  today: string
  userId: string
}

const MEALS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snacks' },
] as const

export default function DashboardClient({ profile, todayLogs, totals, waterGlasses, weekData, today, userId }: Props) {
  const [waterCount, setWaterCount] = useState(waterGlasses)
  const [isAddingWater, setIsAddingWater] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const displayName = profile.display_name || 'Athlete'
  const dateFormatted = new Date(today + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  })

  // Goals
  const calGoal = profile.daily_calorie_goal || 2200
  const proteinGoal = profile.daily_protein_goal || 160
  const carbsGoal = profile.daily_carbs_goal || 250
  const fatGoal = profile.daily_fat_goal || 70
  const waterGoal = profile.daily_water_goal || 8

  const calRemaining = Math.max(0, calGoal - totals.calories)
  const calPct = Math.min(100, Math.round((totals.calories / calGoal) * 100))

  async function addWater() {
    if (isAddingWater || !userId) return
    setIsAddingWater(true)
    const newCount = waterCount + 1
    setWaterCount(newCount)
    await supabase.from('water_logs').upsert({
      user_id: userId,
      logged_date: today,
      glasses: newCount,
      ml_per_glass: 250,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,logged_date' })
    setIsAddingWater(false)
  }

  async function removeWater() {
    if (waterCount <= 0 || isAddingWater || !userId) return
    setIsAddingWater(true)
    const newCount = waterCount - 1
    setWaterCount(newCount)
    await supabase.from('water_logs').upsert({
      user_id: userId,
      logged_date: today,
      glasses: newCount,
      ml_per_glass: 250,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,logged_date' })
    setIsAddingWater(false)
  }

  async function deleteLog(id: string) {
    setDeletingId(id)
    await supabase.from('food_logs').delete().eq('id', id)
    router.refresh()
  }

  async function fetchAiInsight() {
    setLoadingAi(true)
    try {
      const res = await fetch('/api/ai/daily-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs: todayLogs,
          totals,
          goals: { calories: calGoal, protein: proteinGoal, carbs: carbsGoal, fat: fatGoal, water: waterGoal },
          waterGlasses: waterCount,
        }),
      })
      const data = await res.json()
      if (data.insight) setAiInsight(data.insight)
    } catch {
      setAiInsight('Maintain steady protein distribution across meals to support muscle protein synthesis.')
    }
    setLoadingAi(false)
  }

  return (
    <div className={styles.page}>
      <div className="container">

        {/* ── 1. HEADER (Compact, non-distracting) ── */}
        <header className={styles.topHeader}>
          <div>
            <div className={styles.headerBadge}>
              <span className={styles.liveDot} />
              <span>SAGE TELEMETRY</span>
            </div>
            <h1 className={styles.headerTitle}>{displayName}</h1>
            <p className={styles.headerDate}>{dateFormatted}</p>
          </div>

          <Link href="/log" className={styles.headerQuickLogBtn} id="dashboard-quick-log">
            <Plus size={15} strokeWidth={2.4} />
            <span>Log Fuel</span>
          </Link>
        </header>

        {/* ── 2. MACROFACTOR-STYLE PRIMARY ENERGY TELEMETRY HUD ── */}
        <section className={styles.energyHudCard} aria-label="Energy Balance Telemetry">
          {/* Energy Math Equation: [Goal] - [Food] = [Remaining] */}
          <div className={styles.equationRow}>
            <div className={styles.equationCol}>
              <span className={styles.equationLabel}>DAILY TARGET</span>
              <span className={`${styles.equationValue} tabular`}>{calGoal.toLocaleString()}</span>
              <span className={styles.equationUnit}>kcal</span>
            </div>

            <div className={styles.equationSign}>−</div>

            <div className={styles.equationCol}>
              <span className={styles.equationLabel}>CONSUMED</span>
              <span className={`${styles.equationValue} tabular`}>{Math.round(totals.calories).toLocaleString()}</span>
              <span className={styles.equationUnit}>kcal</span>
            </div>

            <div className={styles.equationSign}>=</div>

            <div className={`${styles.equationCol} ${styles.equationColHighlight}`}>
              <span className={styles.equationLabel}>REMAINING</span>
              <span className={`${styles.equationValue} ${styles.equationValueRemaining} tabular`}>
                {Math.round(calRemaining).toLocaleString()}
              </span>
              <span className={styles.equationUnit}>kcal</span>
            </div>
          </div>

          {/* Unified Caloric Track */}
          <div className={styles.caloricTrack}>
            <div
              className={styles.caloricFill}
              style={{ width: `${calPct}%` }}
              role="progressbar"
              aria-valuenow={calPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {/* 3-Pillar Macronutrient Summary */}
          <div className={styles.macroPillarsGrid}>
            <MacroPillar
              name="Protein"
              value={totals.protein_g}
              goal={proteinGoal}
              unit="g"
              barStyle="solid"
            />
            <MacroPillar
              name="Carbs"
              value={totals.carbs_g}
              goal={carbsGoal}
              unit="g"
              barStyle="medium"
            />
            <MacroPillar
              name="Fats"
              value={totals.fat_g}
              goal={fatGoal}
              unit="g"
              barStyle="dark"
            />
          </div>
        </section>

        {/* ── 3. COMPACT HYDRATION TELEMETRY (Single Row) ── */}
        <section className={styles.hydrationStrip} aria-label="Hydration Level">
          <div className={styles.hydrationInfo}>
            <Droplets size={16} strokeWidth={2.2} color="#FFFFFF" />
            <div>
              <span className={styles.hydrationTitle}>Hydration</span>
              <span className={`${styles.hydrationValues} tabular`}>
                {(waterCount * 0.25).toFixed(1)}L <span className={styles.hydrationTarget}>/ {(waterGoal * 0.25).toFixed(1)}L</span>
              </span>
            </div>
          </div>

          {/* Volumetric Capsules */}
          <div className={styles.waterCapsules}>
            {Array.from({ length: Math.max(waterGoal, 8) }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={i < waterCount ? removeWater : addWater}
                className={`${styles.capsule} ${i < waterCount ? styles.capsuleFilled : ''}`}
                title={i < waterCount ? 'Remove glass' : 'Add glass'}
                disabled={isAddingWater}
                aria-label={`Water glass ${i + 1}`}
              />
            ))}
          </div>

          <div className={styles.hydrationControls}>
            <button
              type="button"
              onClick={removeWater}
              disabled={waterCount <= 0 || isAddingWater}
              className={styles.waterSmallBtn}
              aria-label="Decrease water"
            >
              <Minus size={13} strokeWidth={2.4} />
            </button>
            <button
              type="button"
              onClick={addWater}
              disabled={isAddingWater}
              className={styles.waterPrimaryBtn}
              aria-label="Add 250ml water"
            >
              <Plus size={13} strokeWidth={2.6} />
              <span>250ml</span>
            </button>
          </div>
        </section>

        {/* ── 4. QUIET METABOLIC TELEMETRY BRIEF (Collapsible / 1-Line AI Status) ── */}
        <section className={styles.metabolicBriefCard} aria-label="Metabolic Analysis">
          <div className={styles.briefHeader}>
            <div className={styles.briefBadge}>
              <ShieldCheck size={13} strokeWidth={2.2} />
              <span>METABOLIC STATUS</span>
            </div>
            {!aiInsight && totals.calories > 0 && (
              <button
                type="button"
                onClick={fetchAiInsight}
                disabled={loadingAi}
                className={styles.insightTriggerBtn}
              >
                {loadingAi ? 'Analyzing...' : 'Deep Audit →'}
              </button>
            )}
          </div>
          <p className={styles.briefText}>
            {aiInsight || (
              totals.calories > 0
                ? `${Math.round(totals.protein_g)}g of ${proteinGoal}g protein secured (${Math.round((totals.protein_g / proteinGoal) * 100)}%). ${calRemaining > 0 ? `${Math.round(calRemaining)} kcal remaining to satisfy recovery target.` : 'Daily energy equilibrium achieved.'}`
                : 'System calibrated. Log your post-workout meal or nutrition staple to initiate telemetry tracking.'
            )}
          </p>
        </section>

        {/* ── 5. STRUCTURED MEAL SLOTS (Breakfast · Lunch · Dinner · Snacks) ── */}
        <section className={styles.mealSlotsSection} aria-label="Today's Meal Records">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Meal Telemetry</h2>
            <span className="t-fine tabular" style={{ color: '#888888' }}>
              {todayLogs.length} {todayLogs.length === 1 ? 'ENTRY' : 'ENTRIES'} TODAY
            </span>
          </div>

          <div className={styles.mealCardsGrid}>
            {MEALS.map(meal => {
              const mealLogs = todayLogs.filter(l => l.meal_type === meal.key)
              const mealCalories = mealLogs.reduce((sum, l) => sum + (l.calories || 0), 0)
              const mealProtein = mealLogs.reduce((sum, l) => sum + (l.protein_g || 0), 0)

              return (
                <div key={meal.key} className={styles.mealCard}>
                  {/* Meal Card Header */}
                  <div className={styles.mealCardHeader}>
                    <div>
                      <h3 className={styles.mealCardName}>{meal.label}</h3>
                      <div className={styles.mealCardSubtotals}>
                        <span className="tabular">{Math.round(mealCalories)} kcal</span>
                        {mealProtein > 0 && (
                          <>
                            <span>·</span>
                            <span className="tabular" style={{ color: '#FFFFFF', fontWeight: 600 }}>
                              {Math.round(mealProtein)}g P
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/log?meal=${meal.key}`}
                      className={styles.inlineAddBtn}
                      aria-label={`Add food to ${meal.label}`}
                      id={`add-${meal.key}-btn`}
                    >
                      <Plus size={14} strokeWidth={2.4} />
                      <span>Add</span>
                    </Link>
                  </div>

                  {/* Meal Itemized List or Compact Add Prompt */}
                  {mealLogs.length > 0 ? (
                    <div className={styles.mealItemsList}>
                      {mealLogs.map(log => (
                        <div key={log.id} className={styles.mealItemRow}>
                          <div className={styles.mealItemInfo}>
                            <p className={styles.mealItemName}>{log.food_name}</p>
                            <p className={styles.mealItemMacros}>
                              <span className="tabular" style={{ color: '#FFFFFF', fontWeight: 600 }}>{Math.round(log.protein_g)}g P</span>
                              <span>·</span>
                              <span className="tabular">{Math.round(log.carbs_g)}g C</span>
                              <span>·</span>
                              <span className="tabular">{Math.round(log.fat_g)}g F</span>
                            </p>
                          </div>

                          <div className={styles.mealItemActions}>
                            <div className={styles.mealItemCalBox}>
                              <span className={`${styles.mealItemCals} tabular`}>{Math.round(log.calories)}</span>
                              <span className={styles.mealItemCalLabel}>kcal</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteLog(log.id)}
                              disabled={deletingId === log.id}
                              className={styles.deleteItemBtn}
                              aria-label={`Delete ${log.food_name}`}
                            >
                              <Trash2 size={13} strokeWidth={1.8} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Link href={`/log?meal=${meal.key}`} className={styles.emptyMealSlotPrompt}>
                      <Plus size={13} strokeWidth={2.2} />
                      <span>Log {meal.label}</span>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── 6. 7-DAY INTAKE TRAJECTORY (Compact Collapsible) ── */}
        <section className={styles.trendSection} aria-label="7-Day History Trend">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>7-Day Intake Trajectory</h2>
            <Link href="/history" className={styles.viewHistoryLink}>
              <span>Full History</span>
              <ArrowRight size={13} strokeWidth={2} />
            </Link>
          </div>
          <div className={styles.chartWrapper}>
            <WeekChart data={weekData} calorieGoal={calGoal} />
          </div>
        </section>

      </div>
    </div>
  )
}

// ── Subcomponent: Compact Monochromatic Macro Pillar ──

function MacroPillar({
  name,
  value,
  goal,
  unit,
  barStyle,
}: {
  name: string
  value: number
  goal: number
  unit: string
  barStyle: 'solid' | 'medium' | 'dark'
}) {
  const pct = Math.min(100, Math.round((value / (goal || 1)) * 100))

  return (
    <div className={styles.macroPillar}>
      <div className={styles.macroPillarHeader}>
        <span className={styles.macroPillarName}>{name}</span>
        <span className={`${styles.macroPillarPct} tabular`}>{pct}%</span>
      </div>
      <div className={styles.macroPillarTrack}>
        <div
          className={`${styles.macroPillarFill} ${styles[`macroPillarFill_${barStyle}`]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={styles.macroPillarFooter}>
        <span className={`${styles.macroPillarCurrent} tabular`}>{Math.round(value)}{unit}</span>
        <span className={styles.macroPillarTarget}>/ {goal}{unit}</span>
      </div>
    </div>
  )
}
