'use client'

import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export interface MacroPieChartProps {
  protein: number
  carbs: number
  fat: number
}

const COLORS = ['#FFFFFF', '#A1A1AA', '#52525B']

export function MacroPieChart({ protein, carbs, fat }: MacroPieChartProps): React.JSX.Element {
  const total = protein + carbs + fat
  if (total < 1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', color: 'var(--ink-muted-48)', fontSize: '12px' }}>
        Log fuel to generate macro breakdown
      </div>
    )
  }

  const data = [
    { name: 'Protein', value: Math.round(protein), kcal: Math.round(protein * 4) },
    { name: 'Carbs',   value: Math.round(carbs),   kcal: Math.round(carbs * 4) },
    { name: 'Fat',     value: Math.round(fat),      kcal: Math.round(fat * 9) },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <ResponsiveContainer width={74} height={74}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={22} outerRadius={36} dataKey="value" strokeWidth={0}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any) => [`${value}g`, name]}
            contentStyle={{ backgroundColor: '#141416', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', fontSize: '12px', color: '#fff' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {data.map((d, i) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
            <span style={{ color: 'var(--ink-muted-80)' }}>{d.name}</span>
            <span className="tabular" style={{ fontWeight: 600, marginLeft: 'auto', color: 'var(--on-dark)' }}>{d.value}g</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MacroPieChart
