'use client'

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface BarChartProps {
  data: Array<{ [key: string]: string | number }>
  dataKeys: Array<{ key: string; name: string; color?: string }>
  xAxisKey: string
  height?: number
}

export function BarChart({ data, dataKeys, xAxisKey, height = 300 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip
          formatter={(value: number) =>
            new Intl.NumberFormat('fr-MA', {
              style: 'currency',
              currency: 'MAD',
            }).format(value)
          }
        />
        <Legend />
        {dataKeys.map(({ key, name, color }) => (
          <Bar key={key} dataKey={key} name={name} fill={color || '#8884d8'} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

