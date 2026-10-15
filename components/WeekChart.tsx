'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  data: { date: string; label: string; calories: number; protein: number }[]
  calorieGoal: number
}

export default function WeekChart({ data, calorieGoal }: Props) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--body-muted)' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#0066cc', display: 'inline-block' }} />
          Calories
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--body-muted)' }}>
          <span style={{ width: '12px', height: '2px', background: 'rgba(255,165,0,0.6)', display: 'inline-block', borderTop: '2px dashed rgba(255,165,0,0.6)' }} />
          Goal ({calorieGoal} kcal)
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 0, left: -16, bottom: 0 }} barCategoryGap="30%">
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            tickFormatter={v => v === 0 ? '' : `${v}`}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={{
              backgroundColor: '#1d1d1f',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '13px',
              color: '#fff',
            }}
            formatter={(value: any) => [`${Math.round(Number(value) || 0)} kcal`]}
          />
          <ReferenceLine y={calorieGoal} stroke="rgba(255,165,0,0.5)" strokeDasharray="4 4" />
          <Bar dataKey="calories" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry) => (
              <Cell
                key={entry.date}
                fill={entry.date === today ? '#2997ff' : entry.calories >= calorieGoal ? '#34C759' : '#0066cc'}
                opacity={entry.date === today ? 1 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3,1fr)',
        gap: '12px',
        marginTop: '24px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingTop: '24px',
      }}>
        {[
          { label: 'Avg Calories', value: `${Math.round(data.reduce((s, d) => s + d.calories, 0) / (data.filter(d => d.calories > 0).length || 1))} kcal` },
          { label: 'Days on Track', value: `${data.filter(d => d.calories >= calorieGoal * 0.85 && d.calories <= calorieGoal * 1.1).length} / 7` },
          { label: 'Total This Week', value: `${Math.round(data.reduce((s, d) => s + d.calories, 0)).toLocaleString()} kcal` },
        ].map(stat => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '20px', fontWeight: 600, color: 'var(--on-dark)', letterSpacing: '-0.374px' }}>{stat.value}</p>
            <p style={{ fontSize: '12px', color: 'var(--body-muted)', marginTop: '4px' }}>{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
