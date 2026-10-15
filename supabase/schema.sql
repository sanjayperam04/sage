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

-- ============================================================
-- Seed: 60 common foods (Indian + International)
-- ============================================================
INSERT INTO public.foods (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, default_serving_g, serving_description, is_global) VALUES
-- Staples
('White Rice (cooked)', 130, 2.7, 28.2, 0.3, 0.4, 150, '1 medium bowl (150g)', TRUE),
('Brown Rice (cooked)', 112, 2.6, 23.5, 0.9, 1.8, 150, '1 medium bowl (150g)', TRUE),
('Roti / Chapati', 297, 8.1, 52.0, 5.5, 2.5, 35, '1 medium roti (35g)', TRUE),
('White Bread', 265, 9.0, 49.0, 3.2, 2.7, 30, '1 slice (30g)', TRUE),
('Paratha (plain)', 326, 7.5, 40.0, 15.0, 2.0, 60, '1 paratha (60g)', TRUE),
('Idli', 74, 2.0, 15.0, 0.3, 0.5, 80, '2 idlis (80g)', TRUE),
('Dosa (plain)', 168, 3.9, 24.0, 6.5, 1.0, 120, '1 dosa (120g)', TRUE),
('Oats (cooked)', 71, 2.5, 12.0, 1.5, 1.7, 200, '1 bowl cooked (200g)', TRUE),
-- Dals & Legumes
('Dal (cooked, any)', 115, 8.0, 17.0, 0.8, 5.0, 150, '1 bowl (150g)', TRUE),
('Chole / Chickpeas (cooked)', 164, 8.9, 27.4, 2.6, 7.6, 150, '1 bowl (150g)', TRUE),
('Rajma / Kidney Beans (cooked)', 127, 8.7, 22.8, 0.5, 6.4, 150, '1 bowl (150g)', TRUE),
('Moong Dal (cooked)', 105, 7.0, 18.0, 0.4, 4.0, 150, '1 bowl (150g)', TRUE),
-- Proteins
('Chicken Breast (grilled)', 165, 31.0, 0, 3.6, 0, 100, '1 medium breast (100g)', TRUE),
('Chicken Thigh (grilled)', 209, 26.0, 0, 11.0, 0, 100, '1 thigh (100g)', TRUE),
('Eggs (whole, boiled)', 155, 13.0, 1.1, 11.0, 0, 60, '1 large egg (60g)', TRUE),
('Egg Whites', 52, 11.0, 0.7, 0.2, 0, 100, '3 egg whites (100g)', TRUE),
('Paneer', 265, 18.0, 3.0, 20.0, 0, 100, '100g', TRUE),
('Greek Yogurt', 59, 10.0, 3.6, 0.4, 0, 200, '1 cup (200g)', TRUE),
('Curd / Dahi', 98, 11.0, 3.4, 4.3, 0, 150, '1 katori (150g)', TRUE),
('Salmon (cooked)', 208, 28.0, 0, 10.0, 0, 150, '1 fillet (150g)', TRUE),
('Tuna (canned in water)', 116, 25.5, 0, 1.0, 0, 100, '100g', TRUE),
('Tofu (firm)', 76, 8.0, 1.9, 4.2, 0.3, 100, '100g', TRUE),
-- Dairy
('Whole Milk', 61, 3.2, 4.8, 3.3, 0, 250, '1 glass (250ml)', TRUE),
('Skimmed Milk', 34, 3.4, 5.0, 0.1, 0, 250, '1 glass (250ml)', TRUE),
('Whey Protein (1 scoop)', 120, 25.0, 3.0, 1.5, 0, 30, '1 scoop (30g)', TRUE),
('Cheese (cheddar)', 403, 25.0, 1.3, 33.0, 0, 30, '1 slice (30g)', TRUE),
-- Vegetables
('Spinach (cooked)', 41, 2.9, 6.8, 0.4, 2.2, 100, '100g', TRUE),
('Broccoli (cooked)', 35, 2.4, 7.2, 0.4, 3.3, 100, '100g', TRUE),
('Sweet Potato (boiled)', 90, 2.0, 20.7, 0.1, 3.3, 150, '1 medium (150g)', TRUE),
('Potato (boiled)', 87, 1.9, 20.1, 0.1, 1.8, 150, '1 medium (150g)', TRUE),
('Tomato', 18, 0.9, 3.9, 0.2, 1.2, 100, '1 medium (100g)', TRUE),
('Onion', 40, 1.1, 9.3, 0.1, 1.7, 100, '1 medium (100g)', TRUE),
('Cucumber', 15, 0.6, 3.6, 0.1, 0.5, 100, '100g', TRUE),
('Carrot', 41, 0.9, 9.6, 0.2, 2.8, 100, '1 medium (100g)', TRUE),
('Mixed Vegetables (cooked)', 65, 2.5, 13.0, 0.5, 3.0, 100, '100g', TRUE),
-- Fruits
('Banana', 89, 1.1, 22.8, 0.3, 2.6, 120, '1 medium (120g)', TRUE),
('Apple', 52, 0.3, 13.8, 0.2, 2.4, 180, '1 medium (180g)', TRUE),
('Mango', 60, 0.8, 15.0, 0.4, 1.6, 200, '1 medium (200g)', TRUE),
('Papaya', 43, 0.5, 10.8, 0.3, 1.7, 200, '1 medium (200g)', TRUE),
('Watermelon', 30, 0.6, 7.6, 0.2, 0.4, 300, '2 slices (300g)', TRUE),
('Orange', 47, 0.9, 11.8, 0.1, 2.4, 130, '1 medium (130g)', TRUE),
-- Nuts & Seeds
('Almonds', 579, 21.2, 21.6, 49.9, 12.5, 28, '1 handful (28g)', TRUE),
('Peanuts', 567, 25.8, 16.1, 49.2, 8.5, 30, '1 handful (30g)', TRUE),
('Chia Seeds', 486, 16.5, 42.1, 30.7, 34.4, 15, '1 tbsp (15g)', TRUE),
('Flax Seeds', 534, 18.3, 28.9, 42.2, 27.3, 15, '1 tbsp (15g)', TRUE),
-- Beverages & Drinks
('Coconut Water', 19, 0.7, 3.7, 0.2, 1.1, 250, '1 glass (250ml)', TRUE),
('Orange Juice', 45, 0.7, 10.4, 0.2, 0.2, 250, '1 glass (250ml)', TRUE),
-- Snacks & Fast Food
('Samosa (fried)', 310, 6.0, 36.0, 16.0, 3.0, 100, '2 small samosas (100g)', TRUE),
('Peanut Butter', 588, 25.1, 20.1, 50.4, 6.0, 32, '2 tbsp (32g)', TRUE),
('Dark Chocolate (70%)', 604, 7.8, 46.4, 43.1, 10.9, 30, '3 squares (30g)', TRUE),
-- Common meals
('Biryani (chicken)', 185, 12.0, 22.0, 6.0, 1.0, 250, '1 plate (250g)', TRUE),
('Butter Chicken (with gravy)', 150, 12.0, 6.0, 9.0, 0.5, 200, '1 bowl (200g)', TRUE),
('Dal Makhani', 140, 7.0, 16.0, 5.5, 4.0, 200, '1 bowl (200g)', TRUE),
('Poha', 110, 2.0, 22.0, 1.8, 0.8, 150, '1 plate (150g)', TRUE),
('Upma', 135, 3.5, 22.0, 4.0, 1.5, 150, '1 plate (150g)', TRUE),
('Masala Omelette (2 eggs)', 220, 14.0, 5.0, 16.0, 1.0, 120, '1 omelette (120g)', TRUE),
('Aloo Paratha (with butter)', 440, 9.0, 56.0, 20.0, 3.0, 120, '1 paratha (120g)', TRUE),
('Pasta (cooked)', 131, 5.0, 25.0, 1.1, 1.8, 200, '1 bowl (200g)', TRUE),
('Pizza (1 slice)', 285, 12.0, 36.0, 10.0, 2.0, 107, '1 slice (107g)', TRUE),
('Sandwich (chicken)', 310, 20.0, 35.0, 9.0, 2.0, 180, '1 sandwich (180g)', TRUE);
