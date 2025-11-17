'use client'

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface AreaChartProps {
  data: Array<{ [key: string]: string | number }>
  dataKey: string
  xAxisKey: string
  color?: string
  height?: number
}

export function AreaChart({
  data,
  dataKey,
  xAxisKey,
  color = '#8884d8',
  height = 300,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} />
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}

