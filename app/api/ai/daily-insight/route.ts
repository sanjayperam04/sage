import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { logs, totals, goals, waterGlasses } = await req.json()

    const systemPrompt = `You are a supportive, knowledgeable nutrition coach. Analyze a user's daily food log and provide a brief, encouraging insight.

TONE: Friendly, motivating, specific. Like a personal trainer who knows nutrition.
LENGTH: 2-3 sentences max. Be concise.
FOCUS: Highlight what they did well, and give ONE specific actionable tip.
AVOID: Generic advice, medical claims, guilt-tripping.`

    const userMessage = `Today's nutrition summary:
- Calories: ${Math.round(totals.calories)} / ${goals.calories} goal (${Math.round((totals.calories/goals.calories)*100)}%)
- Protein: ${Math.round(totals.protein_g)}g / ${goals.protein}g goal
- Carbs: ${Math.round(totals.carbs_g)}g / ${goals.carbs}g goal  
- Fat: ${Math.round(totals.fat_g)}g / ${goals.fat}g goal
- Water: ${waterGlasses} / ${goals.water} glasses
- Meals logged: ${logs.length} entries

Give me a brief, personalized insight about my day.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 150,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    const insight = completion.choices[0]?.message?.content || 'Keep up the great work tracking your nutrition!'

    return NextResponse.json({ insight })
  } catch (error) {
    console.error('Daily insight error:', error)
    return NextResponse.json({ insight: 'Great job tracking today! Keep it consistent.' })
  }
}
