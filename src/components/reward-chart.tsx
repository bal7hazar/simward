import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface RewardChartProps {
  params: {
    maxReward: number
    b: number
    k: number
    P: number
    T: number
    S: number
    price: number
    entryFee: number
  }
  showCumulative: boolean
  onShowCumulativeChange: (checked: boolean) => void
}

export function RewardChart({ params, showCumulative, onShowCumulativeChange }: RewardChartProps) {
  const { maxReward, b, k, P, T, S, price, entryFee } = params

  // Calculate constant 'a' from maxReward
  // Assuming S = T, formula simplifies to: a = maxReward / [1/((P+b)^k - P^k) - 1/(P+b)^k]
  const a = useMemo(() => {
    const term1 = (P + b) ** k - P ** k
    const term2 = (P + b) ** k

    if (term1 === 0 || term2 === 0) return 0

    const denominator = 1 / term1 - 1 / term2
    if (denominator === 0) return 0

    return maxReward / denominator
  }, [maxReward, b, k, P])

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

  // Calculate break-even point where curve (cumulative or reward) USD equals entry fee
  const breakEvenPoint = useMemo(() => {
    const valueKey = showCumulative ? 'cumulativeUsd' : 'yUsd'
    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1]
      const curr = chartData[i]
      const prevValue = prev[valueKey]
      const currValue = curr[valueKey]

      if (prevValue <= entryFee && currValue >= entryFee) {
        const ratio = (entryFee - prevValue) / (currValue - prevValue)
        const breakEvenP = prev.p + ratio * (curr.p - prev.p)
        return {
          p: Number(breakEvenP.toFixed(2)),
          valueUsd: entryFee,
        }
      }
    }
    return null
  }, [chartData, entryFee, showCumulative])

  const breakEvenData = useMemo(() => {
    if (!breakEvenPoint) return []
    return [{ p: breakEvenPoint.p, valueUsd: breakEvenPoint.valueUsd }]
  }, [breakEvenPoint])

  // Custom star shape for break-even point
  const renderStar = (props: { cx: number; cy: number; fill: string }) => {
    const { cx, cy, fill } = props
    const size = 10
    const points = []
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
      const x = cx + size * Math.cos(angle)
      const y = cy + size * Math.sin(angle)
      points.push(`${x},${y}`)
    }
    return (
      <g>
        <circle cx={cx} cy={cy} r={size + 2} fill="white" />
        <polygon points={points.join(' ')} fill={fill} stroke="white" strokeWidth={2} />
      </g>
    )
  }

  // Generate custom ticks for X axis (only even numbers)
  const xAxisTicks = useMemo(() => {
    const ticks = []
    for (let i = 0; i <= P; i++) {
      if (i % 2 === 0) {
        ticks.push(i)
      }
    }
    return ticks
  }, [P])

  // Calculate Y axis domain based on chart data (only visible series)
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100000]

    const allYValues = chartData.flatMap((d) => (showCumulative ? [d.y, d.cumulative] : [d.y]))
    const maxY = Math.max(...allYValues)

    // Round max to nearest 10,000 (ceiling)
    const roundedMax = Math.ceil(maxY / 10000) * 10000

    return [0, roundedMax]
  }, [chartData, showCumulative])

  // Calculate USD axis domain (same proportions as rewards axis)
  const usdAxisDomain = useMemo(() => {
    return [yAxisDomain[0] * price, yAxisDomain[1] * price]
  }, [yAxisDomain, price])

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
            <p className="text-sm" style={{ color: '#1f2937' }}>
              Reward: {data.y} (${data.yUsd.toFixed(4)})
            </p>
            {showCumulative && (
              <p className="text-sm" style={{ color: '#3b82f6' }}>
                Cumulative: {data.cumulative} (${data.cumulativeUsd.toFixed(4)})
              </p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-full">
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Reward Curve</CardTitle>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
            <input
              type="checkbox"
              checked={showCumulative}
              onChange={(e) => onShowCumulativeChange(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Cumulative reward
          </label>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 25 }}>
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
                domain={yAxisDomain}
                label={{ value: 'Rewards', angle: -90, position: 'insideLeft' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={usdAxisDomain}
                label={{ value: 'USD', angle: 90, position: 'insideRight' }}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                yAxisId="right"
                y={entryFee}
                stroke="#ef4444"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Entry Fee: $${entryFee.toFixed(2)}`,
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 12,
                }}
              />
              {breakEvenPoint && (
                <ReferenceLine
                  yAxisId="right"
                  x={breakEvenPoint.p}
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: 'Break Even',
                    position: 'top',
                    fill: '#22c55e',
                    fontSize: 12,
                    offset: 10,
                  }}
                />
              )}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="y"
                stroke="#1f2937"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="y"
              />
              {showCumulative && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  name="cumulative"
                />
              )}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="yUsd"
                stroke="#1f2937"
                strokeWidth={0}
                dot={false}
                isAnimationActive={false}
                name="yUsd"
                opacity={0}
              />
              {showCumulative && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativeUsd"
                  stroke="#3b82f6"
                  strokeWidth={0}
                  dot={false}
                  isAnimationActive={false}
                  name="cumulativeUsd"
                  opacity={0}
                />
              )}
              {breakEvenPoint && (
                <Scatter
                  yAxisId="right"
                  data={breakEvenData}
                  dataKey="valueUsd"
                  fill="#22c55e"
                  shape={renderStar}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
