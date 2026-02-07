import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface RewardChartProps {
  params: {
    a: number
    b: number
    k: number
    P: number
    T: number
    S: number
    price: number
    entryFee: number
  }
}

export function RewardChart({ params }: RewardChartProps) {
  const { a, b, k, P, T, S, price, entryFee } = params

  // Generate curve data with cumulative rewards
  const chartData = useMemo(() => {
    const data = []
    // Use P as number of points for small values, max 50 for larger values
    const pointCount = Math.min(P, 50)
    const step = P / pointCount
    let cumulativeReward = 0

    for (let p = 0; p <= P; p += step) {
      // Formula: y = a * (1 - (S - T)/T) / ((P+b)^k - p^k) - a * (1 - (S - T)/T) / (P+b)^k
      const numerator = a * (1 - (S - T) / T)
      const term1 = (P + b) ** k - p ** k
      const term2 = (P + b) ** k

      // Avoid division by zero
      const y1 = term1 !== 0 ? numerator / term1 : 0
      const y2 = term2 !== 0 ? numerator / term2 : 0
      const y = y1 - y2

      // Calculate cumulative reward using trapezoidal rule
      if (data.length > 0) {
        const prevY = data[data.length - 1].y
        cumulativeReward += ((prevY + y) / 2) * step
      }

      data.push({
        p: Number(p.toFixed(2)),
        y: Number(y.toFixed(2)),
        cumulative: Number(cumulativeReward.toFixed(2)),
        yUsd: Number((y * price).toFixed(4)),
        cumulativeUsd: Number((cumulativeReward * price).toFixed(4)),
      })
    }

    return data
  }, [a, b, k, P, T, S, price])

  // Generate custom ticks for X axis (max 10 ticks)
  const xAxisTicks = useMemo(() => {
    const tickCount = Math.min(10, P + 1)
    const step = P / (tickCount - 1)
    return Array.from({ length: tickCount }, (_, i) => Math.round(i * step))
  }, [P])

  interface TooltipPayload {
    payload: { p: number; y: number; cumulative: number; yUsd: number; cumulativeUsd: number }
    value: number
    name?: string
    dataKey?: string
  }

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: TooltipPayload[]
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg space-y-1">
          <p className="text-sm font-medium border-b border-border pb-1">Performance: {data.p}</p>
          <div className="space-y-0.5">
            <p className="text-sm" style={{ color: 'hsl(var(--primary))' }}>
              Reward: {data.y} (${data.yUsd.toFixed(4)})
            </p>
            <p className="text-sm" style={{ color: 'hsl(var(--chart-2))' }}>
              Cumulative: {data.cumulative} (${data.cumulativeUsd.toFixed(4)})
            </p>
          </div>
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
            <InlineMath
              math={String.raw`y = a \cdot \frac{1 - \frac{S - T}{T}}{(P+b)^k - p^k} - \frac{a \cdot (1 - \frac{S - T}{T})}{(P+b)^k}`}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reward Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="p"
                type="number"
                domain={[0, P]}
                ticks={xAxisTicks}
                label={{ value: 'Performance (p)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                yAxisId="left"
                label={{ value: 'Rewards', angle: -90, position: 'insideLeft' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: 'USD', angle: 90, position: 'insideRight' }}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                yAxisId="right"
                y={entryFee}
                stroke="hsl(var(--destructive))"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Entry Fee: $${entryFee.toFixed(2)}`,
                  position: 'right',
                  fill: 'hsl(var(--destructive))',
                  fontSize: 12,
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="y"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="y"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="cumulative"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="yUsd"
                stroke="hsl(var(--primary))"
                strokeWidth={0}
                dot={false}
                isAnimationActive={false}
                name="yUsd"
                opacity={0}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulativeUsd"
                stroke="hsl(var(--chart-2))"
                strokeWidth={0}
                dot={false}
                isAnimationActive={false}
                name="cumulativeUsd"
                opacity={0}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
