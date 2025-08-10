'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function TransactionChart({ data }) {
  // Transform data for chart
  const chartData = data.map((replay, index) => ({
    name: `Tx ${index + 1}`,
    gas: parseInt(replay.gasEstimate),
    block: replay.blockNumber,
    status: replay.status
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            Gas: {payload[0].value.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Block: {payload[0].payload.block}
          </p>
          <p className="text-sm text-gray-600">
            Status: <span className="capitalize">{payload[0].payload.status}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="gas" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Gas usage over {data.length} transactions
        </p>
      </div>
    </div>
  )
}
