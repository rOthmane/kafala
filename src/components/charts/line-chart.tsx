'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface LineChartProps {
  data: Array<{ [key: string]: string | number }>
  dataKeys: Array<{ key: string; name: string; color?: string }>
  xAxisKey: string
  height?: number
  tooltipFormatter?: (value: number) => string
}

export function LineChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  tooltipFormatter,
}: LineChartProps) {
  const defaultFormatter = (value: number) =>
    new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(value)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip formatter={tooltipFormatter || defaultFormatter} />
        <Legend />
        {dataKeys.map(({ key, name, color }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={name}
            stroke={color || '#8884d8'}
            strokeWidth={2}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

