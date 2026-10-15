'use client'

import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export interface MacroPieChartProps {
  protein: number
  carbs: number
  fat: number
}

const COLORS = ['#4CAF50', '#FF9800', '#E91E63']

export function MacroPieChart({ protein, carbs, fat }: MacroPieChartProps): React.JSX.Element {
  const total = protein + carbs + fat
  if (total < 1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', color: 'var(--ink-muted-48)', fontSize: '13px' }}>
        Log meals to see macro breakdown
      </div>
    )
  }

  const data = [
    { name: 'Protein', value: Math.round(protein), kcal: Math.round(protein * 4) },
    { name: 'Carbs',   value: Math.round(carbs),   kcal: Math.round(carbs * 4) },
    { name: 'Fat',     value: Math.round(fat),      kcal: Math.round(fat * 9) },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <ResponsiveContainer width={80} height={80}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={24} outerRadius={38} dataKey="value" strokeWidth={0}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any) => [`${value}g`, name]}
            contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid var(--hairline)' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {data.map((d, i) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
            <span style={{ color: 'var(--ink-muted-48)' }}>{d.name}</span>
            <span style={{ fontWeight: 600, marginLeft: 'auto', paddingLeft: '8px', color: 'var(--ink)' }}>{d.value}g</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MacroPieChart
