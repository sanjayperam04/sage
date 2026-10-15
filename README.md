# Sage — Intelligent Nutrition & Macro Architecture

An intelligent, distraction-free nutrition and macro tracking application engineered for gym-goers and athletes, inspired by Apple's Human Interface Guidelines and editorial aesthetic. Built as a sovereign, private alternative to overpriced subscription trackers like HealthifyMe.

---

## Highlights

- **Apple Design Philosophy**: Full black-canvas contrast, warm parchment containers, San Francisco / Geist typography hierarchy, physical spring buttons, frosted navigation blur.
- **Groq LLaMA 3.3 70B Versatile**: Instant natural language meal parsing (*"2 scoops whey with 300ml whole milk and 1 banana"*) and daily AI nutritional insights.
- **Gym-Focused Macro Tracking**: Dynamic circular calorie gauge, protein/carbs/fat progress bars, and macro calorie distribution pie chart.
- **Hydration Tracker**: One-tap glass incrementer with visual hydration meter.
- **Weight Tracking & Trends**: Daily body weight log with automated trend delta calculation.
- **Historical Nutrition**: Interactive 7-day bar chart and historical date inspection.
- **Extensible Food Database**: 20+ built-in gym staples (whey protein, chicken breast, eggs, oats, paneer, dal, rice) plus custom food creation.
- **Supabase Backend**: Complete Row-Level Security (RLS) guaranteeing private user data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack, Server & Client Components) |
| **Language** | TypeScript |
| **Styling** | Vanilla CSS Design System with CSS Tokens (`apple-DESIGN.md`) |
| **Data & Auth** | Supabase (PostgreSQL + Auth + Row Level Security) |
| **AI Inference** | Groq Cloud SDK (`llama-3.3-70b-versatile`) |
| **Visualizations** | Recharts (Responsive SVG Bar & Donut Charts) |

---

## Getting Started

### 1. Configure Environment Variables

Edit `.env.local` with your Supabase and Groq credentials:

```bash
# Supabase (find in your Supabase Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# Groq Cloud (obtain from https://console.groq.com/keys)
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 2. Set Up Supabase Database

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and go to the **SQL Editor**.
2. Open `supabase/schema.sql` from this repository.
3. Paste the entire SQL content and run it. This will create:
   - `profiles` table with trigger on new signup
   - `foods` table seeded with 20+ fitness and Indian meal staples
   - `food_logs` table for tracking daily meals
   - `water_logs` table for daily hydration
   - `weight_logs` table for bodyweight progress
   - Row Level Security (RLS) policies for complete privacy

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start tracking!
