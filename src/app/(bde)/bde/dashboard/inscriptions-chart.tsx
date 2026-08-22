'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type Props = {
  data: { name: string; value: number }[]
}

export function InscriptionsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorBrandBde" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f49915" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f49915" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
        <Area type="monotone" dataKey="value" stroke="#f49915" strokeWidth={2.5} fill="url(#colorBrandBde)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
