import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { description, mealType } = await req.json()

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Please enter what you ate.' }, { status: 400 })
    }

    const systemPrompt = `You are Sage, a precision nutrition and metabolic intelligence system engineered for athletes and fitness enthusiasts.
Analyze food descriptions with rigorous nutritional science standards.

CORE REASONING RULES:
1. ATWATER CONSISTENCY: Calories must be chemically consistent with macronutrients: Calories ≈ (Protein * 4) + (Carbs * 4) + (Fat * 9).
2. PREPARATION & COOKING REALISM:
   - Account for standard cooking mediums (oils, butter, ghee) typical of home and restaurant preparation (~1 tsp oil/ghee = 5g fat / 45 kcal) unless explicitly stated as boiled, steamed, or oil-free.
   - For Indian dishes (e.g. paneer butter masala, biryani, dal tadka), account for typical rich gravies and tempering.
3. ATHLETIC & SUPPLEMENT ACCURACY:
   - 1 standard whey scoop = ~24-26g protein, ~2-3g carbs, ~1-2g fat, ~120-130 kcal.
   - 1 large whole egg = ~6g protein, ~5g fat, ~70 kcal. 1 large egg white = ~3.6g protein, 0g fat, ~17 kcal.
   - 100g cooked skinless chicken breast = ~31g protein, ~3.6g fat, ~165 kcal.
4. INPUT VALIDATION:
   - If the input is not edible food or drink (e.g., gibberish, inanimate objects, non-consumables), return {"is_food": false, "error": "Please describe an edible food or drink."}.

OUTPUT FORMAT (strict JSON, no markdown fences):
{
  "is_food": true,
  "name": "Appetizing descriptive meal title",
  "calories": <integer>,
  "protein": <integer grams>,
  "carbs": <integer grams>,
  "fat": <integer grams>,
  "fiber": <integer grams>,
  "serving_description": "Clear portion breakdown (e.g. 2 medium rotis, 150g chicken breast, 1 bowl dal)",
  "breakdown": [
    {"item": "Component name", "portion": "quantity/grams", "calories": <int>, "protein": <int>}
  ],
  "confidence": "high" | "medium" | "low"
}`

    const completion = await groq.chat.completions.create({
      model: 'qwen/qwen3.8-27b',
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Target Meal: ${mealType || 'General meal'}\nLogged Food: "${description.trim()}"\n\nCalculate total nutrition for the entire description provided.`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) throw new Error('Empty response from Groq')

    // Clean potential markdown wrappers
    const sanitized = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
    const parsed = JSON.parse(sanitized)

    if (parsed.is_food === false) {
      return NextResponse.json({ error: parsed.error || 'Please describe an edible food or drink.' }, { status: 400 })
    }

    const protein = Math.max(0, Math.round(Number(parsed.protein) || 0))
    const carbs = Math.max(0, Math.round(Number(parsed.carbs) || 0))
    const fat = Math.max(0, Math.round(Number(parsed.fat) || 0))
    const fiber = Math.max(0, Math.round(Number(parsed.fiber) || 0))

    // Atwater reconciliation check:
    const atwaterEstimate = (protein * 4) + (carbs * 4) + (fat * 9)
    let parsedCalories = Math.max(0, Math.round(Number(parsed.calories) || 0))

    // If LLM returned 0 calories or diverged by more than 25% from its own macros, reconcile with Atwater formula
    if (parsedCalories === 0 && atwaterEstimate > 0) {
      parsedCalories = atwaterEstimate
    } else if (atwaterEstimate > 0 && Math.abs(parsedCalories - atwaterEstimate) / atwaterEstimate > 0.25) {
      parsedCalories = atwaterEstimate
    }

    const breakdown = Array.isArray(parsed.breakdown)
      ? parsed.breakdown.map((b: { item?: string; portion?: string; calories?: number; protein?: number }) => ({
          item: String(b.item || 'Item').slice(0, 60),
          portion: String(b.portion || '').slice(0, 40),
          calories: Math.max(0, Math.round(Number(b.calories) || 0)),
          protein: Math.max(0, Math.round(Number(b.protein) || 0)),
        }))
      : []

    const result = {
      name: String(parsed.name || description).slice(0, 100),
      calories: parsedCalories,
      protein,
      carbs,
      fat,
      fiber,
      serving_description: String(parsed.serving_description || '').slice(0, 120),
      breakdown,
      confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error('AI food analysis error:', error)
    return NextResponse.json(
      { error: 'Could not analyze this food. Please try with more specific portions (e.g. 2 eggs, 150g rice).' },
      { status: 500 }
    )
  }
}
