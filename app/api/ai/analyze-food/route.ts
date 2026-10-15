import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { description, mealType } = await req.json()

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description required' }, { status: 400 })
    }

    const systemPrompt = `You are a precise nutrition expert. Analyze food descriptions and return accurate nutritional data.

RULES:
- Be accurate and realistic with calorie/macro estimates
- For Indian foods, use standard Indian serving sizes
- For home-cooked meals, estimate generously
- Return ONLY valid JSON, no extra text
- All numeric values must be numbers (not strings)
- meal_type must be one of: breakfast, lunch, dinner, snack

OUTPUT FORMAT (strict JSON):
{
  "name": "descriptive food name",
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "fiber": <number in grams>,
  "serving_description": "what this represents",
  "confidence": "high" | "medium" | "low"
}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analyze this food for ${mealType || 'a meal'}: "${description}"
          
Return the total nutrition for the full description, not per 100g.`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) throw new Error('No response from AI')

    const parsed = JSON.parse(raw)

    // Validate and sanitize
    const result = {
      name: String(parsed.name || description).slice(0, 100),
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      protein: Math.max(0, Math.round(Number(parsed.protein) || 0)),
      carbs: Math.max(0, Math.round(Number(parsed.carbs) || 0)),
      fat: Math.max(0, Math.round(Number(parsed.fat) || 0)),
      fiber: Math.max(0, Math.round(Number(parsed.fiber) || 0)),
      serving_description: String(parsed.serving_description || '').slice(0, 100),
      confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error('AI food analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze food. Please try again.' },
      { status: 500 }
    )
  }
}
