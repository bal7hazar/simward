import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMemo } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
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
    treasuryShare: number
    buybackBurnRatio: number
    initialLiquidity: number
    price: number
    entryFee: number
    avgPerformance: number
    stdDeviation: number
  }
  showCumulative: boolean
  onShowCumulativeChange: (checked: boolean) => void
}

export function RewardChart({ params, showCumulative, onShowCumulativeChange }: RewardChartProps) {
  const {
    maxReward,
    b,
    k,
    P,
    T,
    treasuryShare,
    initialLiquidity,
    price,
    entryFee,
    avgPerformance,
    stdDeviation,
  } = params

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

  // Treasury supply = Initial liquidity × (treasury share / (100% - treasury share))
  const treasurySupply = useMemo(() => {
    if (treasuryShare >= 100) return 0
    return initialLiquidity * (treasuryShare / (100 - treasuryShare))
  }, [initialLiquidity, treasuryShare])

  // Current supply = Treasury supply + Initial liquidity
  const S = useMemo(() => treasurySupply + initialLiquidity, [treasurySupply, initialLiquidity])

  // Generate curve data with cumulative rewards and normal distribution (points at integer p only)
  const { chartData } = useMemo(() => {
    const data: {
      p: number
      y: number
      cumulative: number
      yUsd: number
      cumulativeUsd: number
      distributionDensity: number
    }[] = []
    const step = 1
    let cumulativeReward = 0
    const sigma = Math.max(0.01, stdDeviation)
    const mu = avgPerformance

    for (let p = 0; p <= P; p += step) {
      const numerator = a * (1 - (S - T) / T)
      const term1 = (P + b) ** k - p ** k
      const term2 = (P + b) ** k

      const y1 = term1 !== 0 ? numerator / term1 : 0
      const y2 = term2 !== 0 ? numerator / term2 : 0
      const y = y1 - y2

      if (data.length > 0) {
        const prevY = data[data.length - 1].y
        cumulativeReward += ((prevY + y) / 2) * step
      }

      const exponent = -((p - mu) ** 2) / (2 * sigma ** 2)
      const density = Math.exp(exponent)

      data.push({
        p: Math.round(p),
        y: Number(y.toFixed(2)),
        cumulative: Number(cumulativeReward.toFixed(2)),
        yUsd: Number((y * price).toFixed(4)),
        cumulativeUsd: Number((cumulativeReward * price).toFixed(4)),
        distributionDensity: density,
      })
    }

    const maxDensity = Math.max(...data.map((d) => d.distributionDensity))
    const totalIntegral = data.reduce(
      (sum, d, i) =>
        sum + (i > 0 ? ((d.distributionDensity + data[i - 1].distributionDensity) / 2) * step : 0),
      0
    )

    const allYValues = showCumulative ? data.map((d) => d.cumulative) : data.map((d) => d.y)
    const maxY = Math.max(...allYValues, 0)
    const roundedMax =
      maxY < 1000
        ? Math.max(Math.ceil(maxY / 100) * 100, 100)
        : maxY < 10000
          ? Math.ceil(maxY / 1000) * 1000
          : Math.ceil(maxY / 10000) * 10000
    const distHeight = Math.max(roundedMax * 0.25, 1000)

    let cumulativeIntegral = 0
    const chartDataWithDist = data.map((d, i) => {
      if (i > 0) {
        cumulativeIntegral += ((d.distributionDensity + data[i - 1].distributionDensity) / 2) * step
      }
      const distributionCumulativePct =
        totalIntegral > 0 ? (cumulativeIntegral / totalIntegral) * 100 : 0
      return {
        ...d,
        distributionCumulativePct,
        distributionY: maxDensity > 0 ? -(d.distributionDensity / maxDensity) * distHeight : 0,
      }
    })

    return { chartData: chartDataWithDist }
  }, [a, b, k, P, T, S, price, avgPerformance, stdDeviation, showCumulative])

  // Iterative simulation: games at avg, tokens swapped for USD, pool + supply evolve until break-even = avg
  const breakEvenSimResult = useMemo(() => {
    const mu = avgPerformance

    const rewardAt = (p: number, supply: number): number => {
      const numerator = a * (1 - (supply - T) / T)
      const term1 = (P + b) ** k - p ** k
      const term2 = (P + b) ** k
      const y1 = term1 !== 0 ? numerator / term1 : 0
      const y2 = term2 !== 0 ? numerator / term2 : 0
      return y1 - y2
    }

    const getBreakEven = (supply: number, currentPrice: number): number | null => {
      if (showCumulative) {
        let cum = 0
        let cumPrevUsd = 0
        for (let p = 0; p <= P; p++) {
          const y = rewardAt(p, supply)
          if (p > 0) cum += ((rewardAt(p - 1, supply) + y) / 2) * 1
          const cumUsd = cum * currentPrice
          if (cumUsd >= entryFee) {
            if (p === 0) return 0
            const ratio = (entryFee - cumPrevUsd) / (cumUsd - cumPrevUsd)
            return p - 1 + ratio
          }
          cumPrevUsd = cumUsd
        }
        return null
      }
      let yPrevUsd = rewardAt(0, supply) * currentPrice
      if (yPrevUsd >= entryFee) return 0
      for (let p = 1; p <= P; p++) {
        const yUsd = rewardAt(p, supply) * currentPrice
        if (yUsd >= entryFee) {
          const ratio = (entryFee - yPrevUsd) / (yUsd - yPrevUsd)
          return p - 1 + ratio
        }
        yPrevUsd = yUsd
      }
      return null
    }

    // Pool: constant product AMM. price = usd_reserve / token_reserve
    if (initialLiquidity <= 0 || price <= 0) {
      return {
        supplyCreated: 0,
        usdExtracted: 0,
        finalPrice: price,
        games: 0,
        currentBreakEven: null,
        initialBreakEven: null,
        converged: false,
      }
    }
    let tokenReserve = initialLiquidity
    let usdReserve = initialLiquidity * price

    let supply = S
    let totalSupplyCreated = 0
    let totalUsdExtracted = 0
    const maxIter = 500_000
    const tol = 0.01
    const initialBreakEven = getBreakEven(S, usdReserve / tokenReserve)

    for (let n = 0; n < maxIter; n++) {
      const currentPrice = usdReserve / tokenReserve
      const be = getBreakEven(supply, currentPrice)
      if (be !== null && Math.abs(be - mu) <= tol) {
        return {
          supplyCreated: totalSupplyCreated,
          usdExtracted: totalUsdExtracted,
          finalPrice: currentPrice,
          games: n,
          currentBreakEven: be,
          initialBreakEven,
          converged: true,
        }
      }

      const y = rewardAt(mu, supply)

      if (be !== null && be > mu) {
        // Break-even > average: need to destroy supply. Buy tokens with USD (entry fee) and burn.
        const usdIn = entryFee
        const kProd = tokenReserve * usdReserve
        const tokensOut = tokenReserve - kProd / (usdReserve + usdIn)
        const tokensToBurn = Math.min(Math.max(0, tokensOut), Math.max(0, supply - 1))
        if (tokensToBurn > 1e-10) {
          const usdActuallyUsed = kProd / (tokenReserve - tokensToBurn) - usdReserve
          tokenReserve -= tokensToBurn
          usdReserve += usdActuallyUsed
          supply -= tokensToBurn
          totalSupplyCreated -= tokensToBurn
          totalUsdExtracted -= usdActuallyUsed
        }
      } else {
        // Break-even <= average: mint and swap for USD
        supply += y
        totalSupplyCreated += y
        if (y > 0) {
          const usdOut = (usdReserve * y) / (tokenReserve + y)
          tokenReserve += y
          usdReserve -= usdOut
          totalUsdExtracted += usdOut
          if (usdReserve < 1e-10) usdReserve = 1e-10
        }
      }
    }

    const currentPrice = usdReserve / tokenReserve
    const be = getBreakEven(supply, currentPrice)
    return {
      supplyCreated: totalSupplyCreated,
      usdExtracted: totalUsdExtracted,
      finalPrice: currentPrice,
      games: maxIter,
      currentBreakEven: be,
      initialBreakEven,
      converged: false,
    }
  }, [a, b, k, P, T, S, initialLiquidity, price, entryFee, avgPerformance, showCumulative])

  // Final state chart data (when simulation converged): reward/cumulative with final supply & price
  const chartDataWithFinal = useMemo(() => {
    if (!breakEvenSimResult.converged) return chartData

    const finalSupply = S + breakEvenSimResult.supplyCreated
    const finalPrice = breakEvenSimResult.finalPrice

    const rewardAt = (p: number, supply: number): number => {
      const numerator = a * (1 - (supply - T) / T)
      const term1 = (P + b) ** k - p ** k
      const term2 = (P + b) ** k
      const y1 = term1 !== 0 ? numerator / term1 : 0
      const y2 = term2 !== 0 ? numerator / term2 : 0
      return y1 - y2
    }

    const step = 1
    let cumulativeFinal = 0
    return chartData.map((d, i) => {
      const yFinal = rewardAt(d.p, finalSupply)
      if (i > 0) {
        const prevY = chartData[i - 1]
        const prevYFinal = rewardAt(prevY.p, finalSupply)
        cumulativeFinal += ((prevYFinal + yFinal) / 2) * step
      }
      return {
        ...d,
        yFinal: Number(yFinal.toFixed(2)),
        cumulativeFinal: Number(cumulativeFinal.toFixed(2)),
        yUsdFinal: Number((yFinal * finalPrice).toFixed(4)),
        cumulativeUsdFinal: Number((cumulativeFinal * finalPrice).toFixed(4)),
      }
    })
  }, [chartData, breakEvenSimResult, a, b, k, P, T, S])

  // Final break-even point (vertical line)
  const finalBreakEvenPoint = useMemo(() => {
    if (!breakEvenSimResult.converged || chartDataWithFinal === chartData) return null
    const valueKey = showCumulative ? 'cumulativeUsdFinal' : 'yUsdFinal'
    type WithFinal = { p: number } & Record<string, number | undefined>
    for (let i = 1; i < chartDataWithFinal.length; i++) {
      const prev = chartDataWithFinal[i - 1] as WithFinal
      const curr = chartDataWithFinal[i] as WithFinal
      const prevValue = prev[valueKey] ?? 0
      const currValue = curr[valueKey] ?? 0
      if (prevValue <= entryFee && currValue >= entryFee) {
        const ratio = (entryFee - prevValue) / (currValue - prevValue)
        return prev.p + ratio * (curr.p - prev.p)
      }
    }
    return null
  }, [chartDataWithFinal, chartData, breakEvenSimResult.converged, showCumulative, entryFee])

  // Max USD from data for auto-scaling (only include displayed curves)
  const maxUsd = useMemo(() => {
    let max = 0
    for (const d of chartDataWithFinal) {
      const dd = d as {
        yUsd?: number
        cumulativeUsd?: number
        yUsdFinal?: number
        cumulativeUsdFinal?: number
      }
      max = Math.max(max, dd.yUsd ?? 0, dd.yUsdFinal ?? 0)
      if (showCumulative) {
        max = Math.max(max, dd.cumulativeUsd ?? 0, dd.cumulativeUsdFinal ?? 0)
      }
    }
    return Math.max(max, entryFee, 1) * 1.05
  }, [chartDataWithFinal, entryFee, showCumulative])

  const distHeight = maxUsd * 0.25

  // Display data: both states, curves in USD (right axis), distribution scaled for left axis
  const displayData = useMemo(() => {
    const maxDensity = Math.max(...chartData.map((d) => d.distributionDensity))
    return chartDataWithFinal.map((d) => ({
      ...d,
      distributionY: maxDensity > 0 ? (d.distributionDensity / maxDensity) * distHeight : 0,
    }))
  }, [chartData, chartDataWithFinal, distHeight])

  const usdAxisDomain = useMemo(() => [0, maxUsd] as [number, number], [maxUsd])
  const leftAxisDomain = useMemo(() => [0, distHeight * 2] as [number, number], [distHeight])

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

  const rightAxisTicks = useMemo(() => {
    const ticks = [0]
    const step = maxUsd > 0 ? maxUsd / 4 : 1
    for (let i = 1; i <= 4; i++) ticks.push(Number((step * i).toFixed(2)))
    return ticks
  }, [maxUsd])

  interface TooltipPayload {
    payload: {
      p: number
      y: number
      cumulative: number
      yUsd: number
      cumulativeUsd: number
      distributionCumulativePct?: number
      yFinal?: number
      cumulativeFinal?: number
    }
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
      const dd = data as {
        yFinal?: number
        cumulativeFinal?: number
        yUsdFinal?: number
        cumulativeUsdFinal?: number
      }
      return (
        <div className="bg-background/10 border border-border rounded-lg p-3 shadow-lg space-y-1 backdrop-blur-sm">
          <p className="text-sm font-medium border-b border-border pb-1">Performance: {data.p}</p>
          <div className="space-y-0.5">
            <p className="text-sm" style={{ color: '#1f2937' }}>
              Initial reward: {data.y} (${data.yUsd.toFixed(2)})
            </p>
            {showCumulative && (
              <p className="text-sm" style={{ color: '#3b82f6' }}>
                Initial cumulative: {data.cumulative} (${data.cumulativeUsd.toFixed(2)})
              </p>
            )}
            {breakEvenSimResult.converged && dd.yFinal != null && (
              <>
                <p className="text-sm pt-1 border-t border-border" style={{ color: '#64748b' }}>
                  Final reward: {dd.yFinal} (${(dd.yUsdFinal ?? 0).toFixed(2)})
                </p>
                {showCumulative && dd.cumulativeFinal != null && (
                  <p className="text-sm" style={{ color: '#60a5fa' }}>
                    Final cumulative: {dd.cumulativeFinal} ( $
                    {(dd.cumulativeUsdFinal ?? 0).toFixed(2)})
                  </p>
                )}
              </>
            )}
            <p className="text-sm pt-1 border-t border-border" style={{ color: '#ef4444' }}>
              Entry fee: ${entryFee.toFixed(2)}
            </p>
            <p className="text-sm" style={{ color: '#7c3aed' }}>
              Cumulative density: {(data.distributionCumulativePct ?? 0).toFixed(1)}% (population
              with p ≤ {data.p})
            </p>
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
          <div className="relative">
            <div className="absolute top-2 left-2 z-10 rounded border border-border bg-background/95 px-3 py-2 shadow-sm backdrop-blur">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-1 w-4 shrink-0 self-center rounded"
                    style={{ backgroundColor: '#1f2937' }}
                  />
                  <span>Initial reward</span>
                </div>
                {showCumulative && (
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-1 w-4 shrink-0 self-center rounded"
                      style={{ backgroundColor: '#3b82f6' }}
                    />
                    <span>Initial cumulative</span>
                  </div>
                )}
                {breakEvenSimResult.converged && (
                  <>
                    <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
                      <span className="inline-block h-1 w-4 shrink-0 self-center border-b-2 border-dashed border-[#64748b]" />
                      <span>Final reward</span>
                    </div>
                    {showCumulative && (
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-1 w-4 shrink-0 self-center border-b-2 border-dashed border-[#60a5fa]" />
                        <span>Final cumulative</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
                  <span
                    className="inline-block h-1 w-4 shrink-0 self-center rounded"
                    style={{ backgroundColor: '#ef4444' }}
                  />
                  <span>Entry fee</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-1 w-4 shrink-0 self-center rounded"
                    style={{ backgroundColor: '#22c55e' }}
                  />
                  <span>Break even (initial)</span>
                </div>
                {finalBreakEvenPoint != null && (
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-1 w-4 shrink-0 self-center border-b-2 border-dashed border-[#16a34a]" />
                    <span>Break even (final)</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
                  <span
                    className="inline-block h-1 w-4 shrink-0 self-center rounded"
                    style={{ backgroundColor: '#7c3aed' }}
                  />
                  <span>Cumulative density</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart
                data={displayData}
                margin={{ top: 55, right: 30, left: 50, bottom: 25 }}
              >
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
                  domain={leftAxisDomain}
                  tick={false}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={usdAxisDomain}
                  ticks={rightAxisTicks}
                  label={{ value: 'USD', angle: 0, position: 'top', offset: 15, dx: -30 }}
                  tickFormatter={(value) => (value < 0 ? '' : `$${value.toFixed(2)}`)}
                />
                <ReferenceLine yAxisId="left" y={0} stroke="#94a3b8" strokeWidth={1} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="distributionY"
                  name="distributionY"
                  stroke="#7c3aed"
                  strokeWidth={0.75}
                  fill="#7c3aed"
                  fillOpacity={0.2}
                  baseValue={0}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="distributionY"
                  stroke="#7c3aed"
                  strokeWidth={0.5}
                  dot={false}
                  isAnimationActive={false}
                  legendType="none"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="yUsd"
                  stroke="#1f2937"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  name="yUsd"
                />
                {showCumulative && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulativeUsd"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="cumulativeUsd"
                  />
                )}
                {breakEvenSimResult.converged && (
                  <>
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="yUsdFinal"
                      stroke="#64748b"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      isAnimationActive={false}
                      name="yUsdFinal"
                    />
                    {showCumulative && (
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="cumulativeUsdFinal"
                        stroke="#60a5fa"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                        isAnimationActive={false}
                        name="cumulativeUsdFinal"
                      />
                    )}
                  </>
                )}
                <ReferenceLine
                  yAxisId="right"
                  y={entryFee}
                  stroke="#ef4444"
                  strokeWidth={1}
                  label={{
                    value: `Entry Fee: $${entryFee.toFixed(2)}`,
                    position: 'left',
                    fill: '#ef4444',
                    fontSize: 12,
                  }}
                />
                {breakEvenPoint && (
                  <ReferenceLine
                    yAxisId="right"
                    x={breakEvenPoint.p}
                    stroke="#22c55e"
                    strokeWidth={1}
                    label={{
                      value: 'Break Even (initial)',
                      position: 'top',
                      offset: 5,
                      fill: '#22c55e',
                      fontSize: 12,
                    }}
                  />
                )}
                {finalBreakEvenPoint != null && (
                  <ReferenceLine
                    yAxisId="right"
                    x={finalBreakEvenPoint}
                    stroke="#16a34a"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    label={{
                      value: 'Break Even (final)',
                      position: 'top',
                      offset: 25,
                      fill: '#16a34a',
                      fontSize: 12,
                    }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <p className="text-sm text-muted-foreground">
              Constant a (calculated):{' '}
              <span className="font-mono font-semibold text-foreground">
                {new Intl.NumberFormat('en-US').format(Math.round(a))}
              </span>
              <span className="ml-1 text-xs">— Automatically calculated from Max Reward</span>
            </p>
            <p className="text-sm text-muted-foreground">
              USD needed for pool:{' '}
              <span className="font-mono font-semibold text-foreground">
                ${(initialLiquidity * price).toFixed(2)}
              </span>
              <span className="ml-1 text-xs">
                ({new Intl.NumberFormat('en-US').format(Math.round(initialLiquidity))} tokens × $
                {price})
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Treasury supply:{' '}
              <span className="font-mono font-semibold text-foreground">
                {new Intl.NumberFormat('en-US').format(Math.round(treasurySupply))}
              </span>
              <span className="ml-1 text-xs">
                (Initial liquidity × {treasuryShare}% ÷ {100 - treasuryShare}%)
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Initial supply:{' '}
              <span className="font-mono font-semibold text-foreground">
                {new Intl.NumberFormat('en-US').format(Math.round(S))}
              </span>
              <span className="ml-1 text-xs">(Treasury supply + Initial liquidity)</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Break-even (
              <span className="font-mono font-semibold text-foreground">
                {breakEvenSimResult.initialBreakEven != null
                  ? breakEvenSimResult.initialBreakEven.toFixed(2)
                  : '—'}
              </span>
              ) to Average Score (
              <span className="font-mono font-semibold text-foreground">{avgPerformance}</span>){' '}
              {showCumulative && <span className="text-xs">(cumulative)</span>}
              {breakEvenSimResult.converged === false && (
                <span className="ml-1 text-amber-600">— Did not converge</span>
              )}
            </p>
            {breakEvenSimResult.converged !== false && (
              <div className="text-sm text-muted-foreground space-y-1 pl-2 border-l-2 border-border">
                <p>
                  Games played (avg. performance):{' '}
                  <span className="font-mono font-semibold text-foreground">
                    ~{new Intl.NumberFormat('en-US').format(breakEvenSimResult.games)}
                  </span>
                </p>
                <p>
                  Supply created:{' '}
                  <span className="font-mono font-semibold text-foreground">
                    {breakEvenSimResult.supplyCreated >= 0 ? '+' : ''}
                    {new Intl.NumberFormat('en-US', {
                      maximumFractionDigits: 0,
                      minimumFractionDigits: 0,
                    }).format(breakEvenSimResult.supplyCreated)}
                  </span>
                </p>
                <p>
                  Final supply:{' '}
                  <span className="font-mono font-semibold text-foreground">
                    {new Intl.NumberFormat('en-US', {
                      maximumFractionDigits: 0,
                      minimumFractionDigits: 0,
                    }).format(S + breakEvenSimResult.supplyCreated)}
                  </span>
                  <span className="ml-1 text-xs">(Initial supply + Supply created)</span>
                </p>
                <p>
                  USD extracted from pool:{' '}
                  <span className="font-mono font-semibold text-foreground">
                    {breakEvenSimResult.usdExtracted >= 0 ? '+' : ''}$
                    {breakEvenSimResult.usdExtracted.toFixed(2)}
                  </span>
                </p>
                <p>
                  Final token price:{' '}
                  <span className="font-mono font-semibold text-foreground">
                    ${breakEvenSimResult.finalPrice.toFixed(6)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
