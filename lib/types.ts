export interface Profile {
  id: string
  display_name: string | null
  daily_calorie_goal: number
  daily_protein_goal: number
  daily_carbs_goal: number
  daily_fat_goal: number
  daily_fiber_goal: number
  daily_water_goal: number
  weight_unit: 'kg' | 'lbs'
  created_at: string
  updated_at: string
}

export interface Food {
  id: string
  user_id: string | null
  name: string
  brand: string | null
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g: number
  default_serving_g: number
  serving_description: string | null
  is_global: boolean
  created_at: string
}

export interface FoodLog {
  id: string
  user_id: string
  food_id: string | null
  food_name: string
  logged_date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  quantity_g: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  notes: string | null
  ai_generated: boolean
  created_at: string
}

export interface WaterLog {
  id: string
  user_id: string
  logged_date: string
  glasses: number
  ml_per_glass: number
  created_at: string
}

export interface WeightLog {
  id: string
  user_id: string
  logged_date: string
  weight_kg: number
  notes: string | null
  created_at: string
}

export interface DailyTotals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  water_glasses: number
}

export interface MacroBreakdown {
  protein_pct: number
  carbs_pct: number
  fat_pct: number
}

export interface AIFoodAnalysis {
  name: string
  total_calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  serving_description: string
  quantity_g: number
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  confidence: 'high' | 'medium' | 'low'
}
