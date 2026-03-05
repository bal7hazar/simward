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
    emaMaxWeight: number
    emaInitialWeight: number
    entryFee: number
    buybackBurnRatio: number
    T: number
    initialPerformance: number
    price: number
    initialLiquidity: number
    finalPerformance: number
    stdDeviation: number
  }
}

export function RewardChart({ params }: RewardChartProps) {
  const {
    maxReward,
    b,
    k,
    P,
    T,
    buybackBurnRatio,
    initialLiquidity,
    price,
    entryFee,
    finalPerformance,
    stdDeviation,
    initialPerformance,
    emaInitialWeight,
    emaMaxWeight,
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

  // Current supply = Initial liquidity (treasury share dropped)
  const S = useMemo(() => initialLiquidity, [initialLiquidity])

  // Full simulation: each game scores finalPerformance until burn ≈ reward
  const simulation = useMemo(() => {
    if (initialLiquidity <= 0 || price <= 0 || a <= 0) return null

    const rewardAt = (p: number, s: number): number => {
      const num = a * (1 - (s - T) / T)
      const t1 = (P + b) ** k - p ** k
      const t2 = (P + b) ** k
      return Math.max(0, (t1 !== 0 ? num / t1 : 0) - (t2 !== 0 ? num / t2 : 0))
    }

    type SimSnapshot = {
      games: number
      avgPerformance: number
      supply: number
      usdInPool: number
      avgBurn: number
      avgPaid: number
      avgReward: number
      avgEquilibriumPerf: number | null
      multiplierAt2: number
      price: number
      maxRewardUsd: number
    }

    const buildSnapshot = (
      gamesPlayed: number,
      sup: number,
      tokR: number,
      usdR: number,
      eNum: number,
      eDen: number
    ): SimSnapshot => {
      const emaAvg = eNum / eDen
      const curPrice = usdR / tokR

      // Always computed at multiplier=1, independent of avgMultiplier sim param
      const avgBurn = rewardAt(emaAvg, sup)
      const avgPaid = avgBurn / (buybackBurnRatio / 100)
      const avgReward = rewardAt(finalPerformance, sup)

      // Multiplier for a $2 payment at this state
      const usdFB2 = entryFee * (buybackBurnRatio / 100)
      const kPost = tokR * usdR
      const burned2 = tokR - kPost / (usdR + usdFB2)
      const rewAtEma = rewardAt(emaAvg, sup)
      const multiplierAt2 = rewAtEma > 0 ? burned2 / rewAtEma : 0

      // Avg equilibrium: p* such that rewardAt(p*, sup) = avgBurn / (burnRatio%)
      const eqTarget = avgBurn / (buybackBurnRatio / 100)
      let eqLow = 0
      let eqHigh = P
      let avgEquilibriumPerf: number | null = null
      if (eqTarget > 0 && rewardAt(P, sup) >= eqTarget) {
        for (let i = 0; i < 64; i++) {
          const mid = (eqLow + eqHigh) / 2
          if (rewardAt(mid, sup) < eqTarget) eqLow = mid
          else eqHigh = mid
        }
        avgEquilibriumPerf = (eqLow + eqHigh) / 2
      }

      const maxRewardUsd = rewardAt(P, sup) * multiplierAt2 * curPrice

      return {
        games: gamesPlayed,
        avgPerformance: emaAvg,
        supply: sup,
        usdInPool: usdR,
        avgBurn,
        avgPaid,
        avgReward,
        avgEquilibriumPerf,
        multiplierAt2,
        price: curPrice,
        maxRewardUsd,
      }
    }

    let supply = S
    let tokenReserve = initialLiquidity
    let usdReserve = initialLiquidity * price
    let emaNum = initialPerformance * emaInitialWeight
    let emaDenom = emaInitialWeight
    let games = 0
    const maxGames = 100_000

    const initial = buildSnapshot(0, supply, tokenReserve, usdReserve, emaNum, emaDenom)
    let target: SimSnapshot | null = null
    let seenPaidBelowMint = false

    while (games < maxGames) {
      games++

      const emaAvg = emaNum / emaDenom

      // Buy+burn with actual $2 entry fee (price evolves each game via AMM)
      const usdForBurn = entryFee * (buybackBurnRatio / 100)
      const kAmm = tokenReserve * usdReserve
      const newUsdReserve = usdReserve + usdForBurn
      const tokensBurned = tokenReserve - kAmm / newUsdReserve
      tokenReserve = kAmm / newUsdReserve
      usdReserve = newUsdReserve

      supply -= tokensBurned

      // Multiplier = tokensBurned / rewardAt(emaAvg) → reward at finalPerformance scaled by multiplier
      const baseReward = rewardAt(emaAvg, supply)
      const multiplier = baseReward > 0 ? tokensBurned / baseReward : 0
      const reward = multiplier * rewardAt(finalPerformance, supply)
      supply += reward

      const kAmm2 = tokenReserve * usdReserve
      tokenReserve += reward
      usdReserve = kAmm2 / tokenReserve

      if (emaDenom < emaMaxWeight) {
        emaDenom += 1
        emaNum += finalPerformance
      } else {
        emaNum = emaNum - emaNum / emaDenom + finalPerformance
      }

      // Capture inflexion snapshot just after avgPaid crosses above avgMint
      const snapAvgBurn = rewardAt(emaNum / emaDenom, supply)
      const snapAvgPaid = snapAvgBurn / (buybackBurnRatio / 100)
      const snapAvgMint = rewardAt(finalPerformance, supply)
      if (snapAvgPaid <= snapAvgMint) seenPaidBelowMint = true
      if (target === null && seenPaidBelowMint && snapAvgPaid > snapAvgMint) {
        target = buildSnapshot(games, supply, tokenReserve, usdReserve, emaNum, emaDenom)
      }

      // Convergence: burn ≈ reward within 0.1% relative tolerance
      const ref = Math.max(tokensBurned, reward, 1e-10)
      if (Math.abs(tokensBurned - reward) / ref <= 0.001) break
    }

    const equilibrium = buildSnapshot(games, supply, tokenReserve, usdReserve, emaNum, emaDenom)

    return { initial, target, equilibrium }
  }, [
    a,
    b,
    k,
    P,
    T,
    S,
    initialLiquidity,
    price,
    entryFee,
    buybackBurnRatio,
    initialPerformance,
    finalPerformance,
    emaInitialWeight,
    emaMaxWeight,
  ])

  // Generate curve data with normal distribution (points at integer p only)
  const { chartData } = useMemo(() => {
    const data: {
      p: number
      y: number
      yUsd: number
      distributionDensity: number
    }[] = []
    const step = 1
    const sigma = Math.max(0.01, stdDeviation)
    const mu = finalPerformance

    for (let p = 0; p <= P; p += step) {
      const numerator = a * (1 - (S - T) / T)
      const term1 = (P + b) ** k - p ** k
      const term2 = (P + b) ** k

      const y1 = term1 !== 0 ? numerator / term1 : 0
      const y2 = term2 !== 0 ? numerator / term2 : 0
      const y = y1 - y2

      const exponent = -((p - mu) ** 2) / (2 * sigma ** 2)
      const density = Math.exp(exponent)

      data.push({
        p: Math.round(p),
        y: Number(y.toFixed(2)),
        yUsd: Number((y * price).toFixed(4)),
        distributionDensity: density,
      })
    }

    const maxDensity = Math.max(...data.map((d) => d.distributionDensity))
    const totalIntegral = data.reduce(
      (sum, d, i) =>
        sum + (i > 0 ? ((d.distributionDensity + data[i - 1].distributionDensity) / 2) * step : 0),
      0
    )

    const maxY = Math.max(...data.map((d) => d.y), 0)
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
  }, [a, b, k, P, T, S, price, finalPerformance, stdDeviation])

  // Chart data with both curves scaled by their respective multipliers from simulation
  const chartDataWithFinal = useMemo(() => {
    if (!simulation) return chartData

    const rewardAt = (p: number, s: number): number => {
      const numerator = a * (1 - (s - T) / T)
      const term1 = (P + b) ** k - p ** k
      const term2 = (P + b) ** k
      const y1 = term1 !== 0 ? numerator / term1 : 0
      const y2 = term2 !== 0 ? numerator / term2 : 0
      return Math.max(0, y1 - y2)
    }

    const initMult = simulation.initial.multiplierAt2
    const initPrice = simulation.initial.price
    const equilSupply = simulation.equilibrium.supply
    const equilMult = simulation.equilibrium.multiplierAt2
    const equilPrice = simulation.equilibrium.price

    return chartData.map((d) => {
      const yTokens = rewardAt(d.p, S) * initMult
      const yFinalTokens = rewardAt(d.p, equilSupply) * equilMult
      return {
        ...d,
        yTokens: Math.round(yTokens),
        yUsd: Number((yTokens * initPrice).toFixed(4)),
        yFinalTokens: Math.round(yFinalTokens),
        yUsdFinal: Number((yFinalTokens * equilPrice).toFixed(4)),
      }
    })
  }, [chartData, simulation, a, b, k, P, T, S])

  // Break-even points from simulation snapshots
  const equilibriumBreakEvenPoint = simulation?.equilibrium.avgEquilibriumPerf ?? null

  // Max USD from data for auto-scaling
  const maxUsd = useMemo(() => {
    let max = 0
    for (const d of chartDataWithFinal) {
      const dd = d as { yUsd?: number; yUsdFinal?: number }
      max = Math.max(max, dd.yUsd ?? 0, dd.yUsdFinal ?? 0)
    }
    return Math.max(max, entryFee, 1) * 1.05
  }, [chartDataWithFinal, entryFee])

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

  // Calculate break-even point where reward USD equals entry fee
  const breakEvenPoint = simulation?.initial.avgEquilibriumPerf ?? null

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
      yTokens?: number
      yUsd: number
      yFinalTokens?: number
      yUsdFinal?: number
      distributionCumulativePct?: number
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
      return (
        <div className="bg-background/10 border border-border rounded-lg p-3 shadow-lg space-y-1 backdrop-blur-sm">
          <p className="text-sm font-medium border-b border-border pb-1">Performance: {data.p}</p>
          <div className="space-y-0.5">
            <p className="text-sm" style={{ color: '#1f2937' }}>
              Initial: {new Intl.NumberFormat('en-US').format(data.yTokens ?? 0)} ($
              {data.yUsd.toFixed(2)})
            </p>
            {data.yUsdFinal != null && (
              <p className="text-sm pt-1 border-t border-border" style={{ color: '#64748b' }}>
                Equilibrium: {new Intl.NumberFormat('en-US').format(data.yFinalTokens ?? 0)} ($
                {data.yUsdFinal.toFixed(2)})
              </p>
            )}
            <p className="text-sm pt-1 border-t border-border" style={{ color: '#ef4444' }}>
              Entry fee: ${entryFee.toFixed(2)}
            </p>
            {breakEvenPoint != null && (
              <p className="text-sm" style={{ color: '#22c55e' }}>
                Break even (initial): {breakEvenPoint.toFixed(2)}
              </p>
            )}
            {equilibriumBreakEvenPoint != null && (
              <p className="text-sm" style={{ color: '#16a34a' }}>
                Break even (equilibrium): {equilibriumBreakEvenPoint.toFixed(2)}
              </p>
            )}
            <p className="text-sm" style={{ color: '#7c3aed' }}>
              Cumulative density: {(data.distributionCumulativePct ?? 0).toFixed(1)}%
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-full">
      <Card className="h-full overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle>Reward Curve</CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden flex flex-col">
          <div className="relative">
            <div className="absolute top-2 left-2 z-10 rounded border border-border bg-background/95 px-3 py-2 shadow-sm backdrop-blur">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-1 w-4 shrink-0 self-center rounded"
                    style={{ backgroundColor: '#1f2937' }}
                  />
                  <span>Initial</span>
                </div>
                {simulation && (
                  <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
                    <span className="inline-block h-1 w-4 shrink-0 self-center border-b-2 border-dashed border-[#64748b]" />
                    <span>Equilibrium</span>
                  </div>
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
                {equilibriumBreakEvenPoint != null && (
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-1 w-4 shrink-0 self-center border-b-2 border-dashed border-[#16a34a]" />
                    <span>Break even (equilibrium)</span>
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
                {simulation && (
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
                {breakEvenPoint != null && (
                  <ReferenceLine
                    yAxisId="right"
                    x={breakEvenPoint}
                    stroke="#22c55e"
                    strokeWidth={1}
                    label={{
                      value: 'Break even (initial)',
                      position: 'top',
                      offset: 5,
                      fill: '#22c55e',
                      fontSize: 12,
                    }}
                  />
                )}
                {equilibriumBreakEvenPoint != null && (
                  <ReferenceLine
                    yAxisId="right"
                    x={equilibriumBreakEvenPoint}
                    stroke="#16a34a"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    label={{
                      value: 'Break even (equilibrium)',
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
          <div className="mt-4 pt-4 border-t border-border space-y-3 overflow-y-auto flex-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>
                Constant a:{' '}
                <span className="font-mono font-semibold text-foreground">
                  {new Intl.NumberFormat('en-US').format(Math.round(a))}
                </span>
              </span>
            </div>
            {simulation &&
              (() => {
                const fmt = (n: number, dec = 2) => n.toFixed(dec)
                const fmtInt = (n: number) =>
                  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
                const cols: { label: string; snap: typeof simulation.initial | null }[] = [
                  { label: 'Initial', snap: simulation.initial },
                  { label: 'Inflexion', snap: simulation.target },
                  { label: 'Equilibrium', snap: simulation.equilibrium },
                ]
                type Snap = typeof simulation.initial | null
                const redCells: Record<string, string[]> = {
                  Inflexion: ['Avg paid', 'Avg mint'],
                  Equilibrium: ['Avg burn', 'Avg mint'],
                }
                const greenCells: Record<string, string[]> = {
                  Initial: ['Break even'],
                  Inflexion: ['Break even'],
                  Equilibrium: ['Break even'],
                }
                const rows: { label: string; render: (snap: Snap) => string }[] = [
                  { label: 'Games', render: (s) => (s == null ? '—' : fmtInt(s.games)) },
                  {
                    label: 'Avg perf',
                    render: (s) => (s == null ? '—' : fmt(s.avgPerformance, 3)),
                  },
                  { label: 'Supply', render: (s) => (s == null ? '—' : fmtInt(s.supply)) },
                  {
                    label: 'USD in pool',
                    render: (s) => (s == null ? '—' : `$${fmt(s.usdInPool, 2)}`),
                  },
                  { label: 'Avg paid', render: (s) => (s == null ? '—' : `${fmt(s.avgPaid, 2)}`) },
                  { label: 'Avg burn', render: (s) => (s == null ? '—' : `${fmt(s.avgBurn, 2)}`) },
                  {
                    label: 'Avg mint',
                    render: (s) => (s == null ? '—' : `${fmt(s.avgReward, 2)}`),
                  },
                  {
                    label: 'Break even',
                    render: (s) =>
                      s == null
                        ? '—'
                        : s.avgEquilibriumPerf == null
                          ? 'N/A'
                          : fmt(s.avgEquilibriumPerf, 2),
                  },
                  {
                    label: `Mult. at $${entryFee}`,
                    render: (s) => (s == null ? '—' : `${fmt(s.multiplierAt2, 4)}×`),
                  },
                  { label: 'Price', render: (s) => (s == null ? '—' : `$${fmt(s.price, 6)}`) },
                  {
                    label: 'Max reward',
                    render: (s) => (s == null ? '—' : `$${fmt(s.maxRewardUsd, 4)}`),
                  },
                ]
                return (
                  <div>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left text-muted-foreground font-medium py-1 pr-2 w-24" />
                          {cols.map((c) => (
                            <th
                              key={c.label}
                              className="text-center font-semibold text-foreground py-1 px-2 border-b border-border"
                            >
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.label} className="border-b border-border/50 last:border-0">
                            <td className="text-muted-foreground py-1 pr-2">{row.label}</td>
                            {cols.map((c) => {
                              const isRed = redCells[c.label]?.includes(row.label)
                              const isGreen = greenCells[c.label]?.includes(row.label)
                              return (
                                <td
                                  key={c.label}
                                  className={`text-center font-mono font-semibold py-1 px-2 ${isRed ? 'text-red-500' : isGreen ? 'text-green-500' : 'text-foreground'}`}
                                >
                                  {row.render(c.snap)}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
