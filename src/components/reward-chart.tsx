import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface RewardChartProps {
  params: {
    a: number
    k: number
    P: number
    T: number
    S: number
  }
}

export function RewardChart({ params }: RewardChartProps) {
  const { a, k, P, T, S } = params

  // Generate curve data
  const chartData = useMemo(() => {
    const data = []
    // Use P as number of points for small values, max 50 for larger values
    const pointCount = Math.min(P, 50)
    const step = P / pointCount

    for (let p = 0; p <= P; p += step) {
      // Formula: y = a * (1 - (S - T)/T) / (P^k - p^k)
      const numerator = a * (1 - (S - T) / T)
      const denominator = P ** k - p ** k

      // Avoid division by zero
      const y = denominator !== 0 ? numerator / denominator : 0

      data.push({
        p: Number(p.toFixed(2)),
        y: Number(y.toFixed(2)),
      })
    }

    return data
  }, [a, k, P, T, S])

  // Generate custom ticks for X axis (max 10 ticks)
  const xAxisTicks = useMemo(() => {
    const tickCount = Math.min(10, P + 1)
    const step = P / (tickCount - 1)
    return Array.from({ length: tickCount }, (_, i) => Math.round(i * step))
  }, [P])

  interface TooltipPayload {
    payload: { p: number; y: number }
    value: number
  }

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: TooltipPayload[]
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">Performance: {payload[0].payload.p}</p>
          <p className="text-sm text-primary">Reward: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Formula</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-lg p-4 bg-muted rounded-lg">
            <InlineMath math={String.raw`y = a \cdot \frac{1 - \frac{S - T}{T}}{P^k - p^k}`} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reward Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="p"
                type="number"
                domain={[0, P]}
                ticks={xAxisTicks}
                label={{ value: 'Performance (p)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis label={{ value: 'Reward (y)', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="y"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
