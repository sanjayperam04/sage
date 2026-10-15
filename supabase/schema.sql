-- ============================================================
-- Sage Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  daily_calorie_goal INT DEFAULT 2200,
  daily_protein_goal INT DEFAULT 160,
  daily_carbs_goal INT DEFAULT 250,
  daily_fat_goal INT DEFAULT 70,
  daily_fiber_goal INT DEFAULT 30,
  daily_water_goal INT DEFAULT 8,
  weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Foods table (global + user-created)
CREATE TABLE IF NOT EXISTS public.foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  calories_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
  protein_per_100g DECIMAL(8,2) DEFAULT 0,
  carbs_per_100g DECIMAL(8,2) DEFAULT 0,
  fat_per_100g DECIMAL(8,2) DEFAULT 0,
  fiber_per_100g DECIMAL(8,2) DEFAULT 0,
  default_serving_g DECIMAL(8,2) DEFAULT 100,
  serving_description TEXT,
  is_global BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Global foods visible to all" ON public.foods FOR SELECT USING (is_global = TRUE OR auth.uid() = user_id);
CREATE POLICY "Users can create own foods" ON public.foods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own foods" ON public.foods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own foods" ON public.foods FOR DELETE USING (auth.uid() = user_id);

-- Food log entries
CREATE TABLE IF NOT EXISTS public.food_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  food_name TEXT NOT NULL,
  logged_date DATE DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  quantity_g DECIMAL(8,2) NOT NULL DEFAULT 100,
  calories DECIMAL(8,2) DEFAULT 0,
  protein_g DECIMAL(8,2) DEFAULT 0,
  carbs_g DECIMAL(8,2) DEFAULT 0,
  fat_g DECIMAL(8,2) DEFAULT 0,
  fiber_g DECIMAL(8,2) DEFAULT 0,
  notes TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own food logs" ON public.food_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own food logs" ON public.food_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own food logs" ON public.food_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own food logs" ON public.food_logs FOR DELETE USING (auth.uid() = user_id);

-- Water log
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logged_date DATE DEFAULT CURRENT_DATE,
  glasses INT DEFAULT 1,
  ml_per_glass INT DEFAULT 250,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own water logs" ON public.water_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own water logs" ON public.water_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own water logs" ON public.water_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own water logs" ON public.water_logs FOR DELETE USING (auth.uid() = user_id);

-- Weight log
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logged_date DATE DEFAULT CURRENT_DATE,
  weight_kg DECIMAL(5,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own weight logs" ON public.weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weight logs" ON public.weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weight logs" ON public.weight_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own weight logs" ON public.weight_logs FOR DELETE USING (auth.uid() = user_id);

