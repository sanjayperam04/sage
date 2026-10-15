'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'

export interface WeekChartProps {
  data: { date: string; label: string; calories: number; protein: number }[]
  calorieGoal: number
}

export function WeekChart({ data, calorieGoal }: WeekChartProps): React.JSX.Element {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ink-muted-80)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFFFFF', display: 'inline-block' }} />
          Daily Calories
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ink-muted-80)' }}>
          <span style={{ width: '12px', height: '2px', background: 'rgba(255, 255, 255, 0.45)', display: 'inline-block' }} />
          Target ({calorieGoal} kcal)
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 0, left: -18, bottom: 0 }} barCategoryGap="28%">
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
            tickFormatter={v => v === 0 ? '' : `${v}`}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={{
              backgroundColor: '#0E0E0E',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#fff',
            }}
            formatter={(value: any) => [`${Math.round(Number(value) || 0)} kcal`]}
          />
          <ReferenceLine y={calorieGoal} stroke="rgba(255, 255, 255, 0.45)" strokeDasharray="3 3" />
          <Bar dataKey="calories" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {data.map((entry) => (
              <Cell
                key={entry.date}
                fill={entry.date === today ? '#FFFFFF' : entry.calories >= calorieGoal ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.25)'}
                opacity={entry.date === today ? 1 : 0.85}
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

export default WeekChart
