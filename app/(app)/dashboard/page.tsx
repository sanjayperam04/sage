import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import type { Profile, FoodLog, WaterLog } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  // Fetch all data in parallel
  const [profileRes, logsRes, waterRes, weekLogsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('food_logs').select('*').eq('user_id', user.id).eq('logged_date', today).order('created_at'),
    supabase.from('water_logs').select('*').eq('user_id', user.id).eq('logged_date', today),
    supabase.from('food_logs').select('logged_date, calories, protein_g, carbs_g, fat_g')
      .eq('user_id', user.id)
      .gte('logged_date', getWeekStart())
      .lte('logged_date', today),
  ])

  const profile: Profile = profileRes.data || {
    id: user.id,
    display_name: user.email?.split('@')[0] || 'Friend',
    daily_calorie_goal: 2200,
    daily_protein_goal: 160,
    daily_carbs_goal: 250,
    daily_fat_goal: 70,
    daily_fiber_goal: 30,
    daily_water_goal: 8,
    weight_unit: 'kg',
    created_at: '',
    updated_at: '',
  }

  const todayLogs: FoodLog[] = logsRes.data || []
  const waterLogs: WaterLog[] = waterRes.data || []
  const weekLogs = weekLogsRes.data || []

  // Calculate totals
  const totals = todayLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      protein_g: acc.protein_g + (log.protein_g || 0),
      carbs_g: acc.carbs_g + (log.carbs_g || 0),
      fat_g: acc.fat_g + (log.fat_g || 0),
      fiber_g: acc.fiber_g + (log.fiber_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  )

  const waterGlasses = waterLogs.reduce((acc, log) => acc + (log.glasses || 0), 0)

  // Build week data
  const weekData = buildWeekData(weekLogs, today)

  return (
    <DashboardClient
      profile={profile}
      todayLogs={todayLogs}
      totals={totals}
      waterGlasses={waterGlasses}
      weekData={weekData}
      today={today}
      userId={user.id}
    />
  )
}

function getWeekStart() {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return d.toISOString().split('T')[0]
}

function buildWeekData(logs: { logged_date: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }[], today: string) {
  const days: { date: string; label: string; calories: number; protein: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayLogs = logs.filter(l => l.logged_date === dateStr)
    days.push({
      date: dateStr,
      label: i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' }),
      calories: dayLogs.reduce((s, l) => s + (l.calories || 0), 0),
      protein: dayLogs.reduce((s, l) => s + (l.protein_g || 0), 0),
    })
  }
  return days
}
