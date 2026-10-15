import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { logs, totals, goals, waterGlasses } = await req.json()

    // Extract recent logged food names
    const loggedFoodNames = Array.isArray(logs)
      ? logs.slice(0, 8).map((l: { food_name?: string }) => l.food_name).filter(Boolean).join(', ')
      : 'None'

    const calDiff = Math.round(totals.calories - goals.calories)
    const proteinDiff = Math.round(totals.protein_g - goals.protein)
    const waterDiff = goals.water - waterGlasses

    const systemPrompt = `You are Sage, an elite athletic nutrition and metabolic intelligence system.
Analyze the user's daily fuel, macro execution, and recovery markers for gym performance.

CORE PRINCIPLES:
1. HIGH SIGNAL, ZERO FLUFF: No cheerleading clichés ("Great job!", "Keep pushing!"). No medical disclaimers.
2. ATHLETIC CONTEXT: Connect their macros to muscle protein synthesis, glycogen replenishment, hydration cellular volume, or recovery.
3. FORMAT: Exactly 2 clean, punchy sentences.
   - Sentence 1 (Diagnosis): State the most critical observation regarding their macro distribution, protein target, or calorie balance.
   - Sentence 2 (Prescription): Give ONE specific, actionable food/hydration adjustment to execute right now or tomorrow.
4. TONE: Calm, analytical, authoritative, grounded. No emojis, no markdown headers.`

    const userMessage = `Current Daily Nutrition State:
- Logged items today: ${loggedFoodNames || 'No meals logged yet'}
- Calories: ${Math.round(totals.calories)} kcal consumed vs ${goals.calories} kcal goal (${calDiff > 0 ? `+${calDiff} kcal surplus` : `${calDiff} kcal deficit`})
- Protein: ${Math.round(totals.protein_g)}g vs ${goals.protein}g goal (${proteinDiff >= 0 ? `target achieved (+${proteinDiff}g)` : `${Math.abs(proteinDiff)}g remaining`})
- Carbs: ${Math.round(totals.carbs_g)}g vs ${goals.carbs}g goal
- Fat: ${Math.round(totals.fat_g)}g vs ${goals.fat}g goal
- Hydration: ${waterGlasses} of ${goals.water} glasses logged (${waterDiff > 0 ? `${waterDiff} glasses behind` : 'target met'})

Deliver your 2-sentence performance insight.`

    const completion = await groq.chat.completions.create({
      model: 'qwen/qwen3.8-27b',
      temperature: 0.3,
      max_tokens: 150,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.trim()
    const insight = raw || 'Maintain consistent protein pacing across your meals to optimize recovery and training adaptations.'

    return NextResponse.json({ insight })
  } catch (error) {
    console.error('Daily insight error:', error)
    return NextResponse.json({
      insight: 'Maintain consistent protein pacing across your meals to optimize recovery and training adaptations.',
    })
  }
}
