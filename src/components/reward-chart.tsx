import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ReactNode, useMemo, useState } from 'react'
import {
  Area,
  Bar,
  BarChart,
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
    swapFee: number
    T: number
    initialPerformance: number
    initialStake: number
    initialSupply: number
    initialLiquidity: number
    finalPerformance: number
    stdDeviation: number
    skewness: number
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
    swapFee,
    initialStake,
    initialSupply,
    initialLiquidity,
    entryFee,
    finalPerformance,
    stdDeviation,
    skewness,
    initialPerformance,
    emaInitialWeight,
    emaMaxWeight,
  } = params

  const [copied, setCopied] = useState(false)

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

  const S = initialSupply

  const skewNormalXi = useMemo(() => {
    const sig = Math.max(0.01, stdDeviation)
    const alpha = skewness
    const erf = (x: number): number => {
      const t = 1 / (1 + 0.3275911 * Math.abs(x))
      const y =
        1 -
        t *
          (0.254829592 +
            t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) *
          Math.exp(-x * x)
      return x >= 0 ? y : -y
    }
    const snPdf = (t: number) => Math.exp((-t * t) / 2) / Math.sqrt(2 * Math.PI)
    const snCdf = (t: number) => 0.5 * (1 + erf(t / Math.sqrt(2)))
    let lo = -10
    let hi = 10
    for (let i = 0; i < 100; i++) {
      const m1 = lo + (hi - lo) / 3
      const m2 = hi - (hi - lo) / 3
      if (snPdf(m1) * snCdf(alpha * m1) < snPdf(m2) * snCdf(alpha * m2)) lo = m1
      else hi = m2
    }
    return finalPerformance - sig * ((lo + hi) / 2)
  }, [finalPerformance, stdDeviation, skewness])

  const simulation = useMemo(() => {
    if (initialLiquidity <= 0 || initialStake <= 0 || a <= 0) return null

    const rewardAt = (p: number, s: number): number => {
      const num = a * (1 - (s - T) / T)
      const t1 = (P + b) ** k - p ** k
      const t2 = (P + b) ** k
      return Math.max(0, (t1 !== 0 ? num / t1 : 0) - (t2 !== 0 ? num / t2 : 0))
    }

    const r0 = (p: number): number => {
      const t1 = (P + b) ** k - p ** k
      const t2 = (P + b) ** k
      return Math.max(0, (t1 !== 0 ? a / t1 : 0) - (t2 !== 0 ? a / t2 : 0) + p)
    }

    const tauB = buybackBurnRatio / 100

    const sigma = Math.max(0.01, stdDeviation)
    const delta = skewness / Math.sqrt(1 + skewness * skewness)

    let bmSpare: number | null = null
    const randNormal = (): number => {
      if (bmSpare !== null) {
        const spare = bmSpare
        bmSpare = null
        return spare
      }
      let u = 0
      let v = 0
      let s = 0
      do {
        u = Math.random() * 2 - 1
        v = Math.random() * 2 - 1
        s = u * u + v * v
      } while (s >= 1 || s === 0)
      const mul = Math.sqrt((-2 * Math.log(s)) / s)
      bmSpare = v * mul
      return u * mul
    }
    const samplePerf = (): number => {
      const z0 = Math.abs(randNormal())
      const w = randNormal()
      const raw = skewNormalXi + sigma * (delta * z0 + Math.sqrt(1 - delta * delta) * w)
      return Math.max(0, Math.min(P, raw))
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
      treasurySharePct: number | null
      alphaS: number
      alphaB: number
      r0AtEma: number
      burn: number
      paid: number
      rewardEmaSnap: number
      teamRevenue: number
    }

    const buildSnapshot = (
      gamesPlayed: number,
      sup: number,
      tokR: number,
      usdR: number,
      eNum: number,
      eDen: number,
      rewardEmaParam = 0,
      teamRevenueParam = 0
    ): SimSnapshot => {
      const emaAvg = eNum / eDen
      const curPrice = usdR / tokR

      const avgBurn = rewardAt(emaAvg, sup)
      const avgPaid = avgBurn / tauB

      const usdFB2 = entryFee * tauB * (1 - swapFee / 100)
      const kPost = tokR * usdR
      const burned2 = tokR - kPost / (usdR + usdFB2)
      const usdPaid = entryFee * (1 - swapFee / 100)
      const paid = tokR - kPost / (usdR + usdPaid)

      const alphaS = T > 0 ? (2 * T - sup) / T : 0
      const r0AtEma = r0(emaAvg)
      const alphaB = r0AtEma > 0 ? burned2 / r0AtEma : 0
      const multiplierAt2 = alphaS * alphaB
      const avgReward = rewardEmaParam > 0 ? rewardEmaParam : r0AtEma * multiplierAt2

      const breakEvenR0 =
        multiplierAt2 > 0 && curPrice > 0 ? entryFee / (multiplierAt2 * curPrice) : null
      let avgEquilibriumPerf: number | null = null
      if (breakEvenR0 !== null && r0(P) >= breakEvenR0) {
        let eqLow = 0
        let eqHigh = P
        for (let i = 0; i < 64; i++) {
          const mid = (eqLow + eqHigh) / 2
          if (r0(mid) < breakEvenR0) eqLow = mid
          else eqHigh = mid
        }
        avgEquilibriumPerf = (eqLow + eqHigh) / 2
      }

      const maxRewardUsd = r0(P) * multiplierAt2 * curPrice

      const teamTokens = S - initialLiquidity
      const totalShareDenom = sup - initialLiquidity
      const treasurySharePct = totalShareDenom > 0 ? (teamTokens / totalShareDenom) * 100 : null

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
        treasurySharePct,
        alphaS,
        alphaB,
        r0AtEma,
        burn: burned2,
        paid,
        rewardEmaSnap: rewardEmaParam,
        teamRevenue: teamRevenueParam,
      }
    }

    let supply = S
    let tokenReserve = initialLiquidity
    let usdReserve = initialStake
    let emaNum = initialPerformance * emaInitialWeight
    let emaDenom = emaInitialWeight
    let games = 0
    const maxGames = 100_000
    let rewardEma = 0
    let burnEma = 0
    let teamRevenue = 0
    const perfCounts = new Array(Math.floor(P) + 1).fill(0) as number[]

    const initial = buildSnapshot(0, supply, tokenReserve, usdReserve, emaNum, emaDenom)
    let target: SimSnapshot | null = null
    let teamShareSnap: SimSnapshot | null = null
    let teamRevenueSnap: SimSnapshot | null = null
    let equilibriumSnap: SimSnapshot | null = null
    let seenPaidBelowMint = false
    const teamTokens = S - initialLiquidity

    while (games < maxGames) {
      games++

      const emaAvg = emaNum / emaDenom

      const totalMinted = supply - initialLiquidity
      const teamShareFrac = totalMinted > 0 ? teamTokens / totalMinted : 0
      teamRevenue += entryFee * (1 - buybackBurnRatio / 100) * teamShareFrac

      const usdForBurn = entryFee * (buybackBurnRatio / 100) * (1 - swapFee / 100)
      const kAmm = tokenReserve * usdReserve
      const newUsdReserve = usdReserve + usdForBurn
      const tokensBurned = tokenReserve - kAmm / newUsdReserve
      tokenReserve = kAmm / newUsdReserve
      usdReserve = newUsdReserve

      supply -= tokensBurned

      const sampledPerf = samplePerf()
      perfCounts[Math.min(Math.floor(P), Math.floor(sampledPerf))]++
      const alphaS_v = T > 0 ? (2 * T - supply) / T : 0
      const r0AtEma_v = r0(emaAvg)
      const alphaB_v = r0AtEma_v > 0 ? tokensBurned / r0AtEma_v : 0
      const reward = alphaS_v * alphaB_v * r0(sampledPerf)
      const decay = 1 / Math.min(games, emaMaxWeight)
      rewardEma = games === 1 ? reward : rewardEma + (reward - rewardEma) * decay
      burnEma = games === 1 ? tokensBurned : burnEma + (tokensBurned - burnEma) * decay
      supply += reward

      const kAmm2 = tokenReserve * usdReserve
      tokenReserve += reward
      usdReserve = kAmm2 / tokenReserve

      if (emaDenom < emaMaxWeight) {
        emaDenom += 1
        emaNum += sampledPerf
      } else {
        emaNum = emaNum - emaNum / emaDenom + sampledPerf
      }

      const usdForPaid = entryFee * (1 - swapFee / 100)
      const kSnap = tokenReserve * usdReserve
      const snapPaid = tokenReserve - kSnap / (usdReserve + usdForPaid)
      if (games >= emaMaxWeight) {
        if (snapPaid <= rewardEma) seenPaidBelowMint = true
        if (target === null && seenPaidBelowMint && snapPaid > rewardEma) {
          target = buildSnapshot(
            games,
            supply,
            tokenReserve,
            usdReserve,
            emaNum,
            emaDenom,
            rewardEma,
            teamRevenue
          )
        }
        if (
          teamShareSnap === null &&
          supply > initialLiquidity &&
          (teamTokens / (supply - initialLiquidity)) * 100 < 50
        ) {
          teamShareSnap = buildSnapshot(
            games,
            supply,
            tokenReserve,
            usdReserve,
            emaNum,
            emaDenom,
            rewardEma,
            teamRevenue
          )
        }
        if (teamRevenueSnap === null && teamRevenue > initialStake) {
          teamRevenueSnap = buildSnapshot(
            games,
            supply,
            tokenReserve,
            usdReserve,
            emaNum,
            emaDenom,
            rewardEma,
            teamRevenue
          )
        }
        const ref = Math.max(burnEma, rewardEma, 1e-10)
        const equilReached = Math.abs(burnEma - rewardEma) / ref <= 0.001
        if (equilReached && equilibriumSnap === null) {
          equilibriumSnap = buildSnapshot(
            games,
            supply,
            tokenReserve,
            usdReserve,
            emaNum,
            emaDenom,
            rewardEma,
            teamRevenue
          )
        }
        const roiReached = teamRevenue > initialStake
        if (equilReached && roiReached) break
      }
    }

    const equilibrium =
      equilibriumSnap ??
      buildSnapshot(
        games,
        supply,
        tokenReserve,
        usdReserve,
        emaNum,
        emaDenom,
        rewardEma,
        teamRevenue
      )

    return { initial, target, teamShareSnap, teamRevenueSnap, equilibrium, perfCounts }
  }, [
    a,
    b,
    k,
    P,
    T,
    S,
    initialLiquidity,
    initialStake,
    entryFee,
    buybackBurnRatio,
    swapFee,
    initialPerformance,
    stdDeviation,
    skewness,
    skewNormalXi,
    emaInitialWeight,
    emaMaxWeight,
  ])

  const { chartData } = useMemo(() => {
    const data: {
      p: number
      y: number
      yUsd: number
      distributionDensity: number
    }[] = []
    const step = 1
    const sigma = Math.max(0.01, stdDeviation)
    const alpha = skewness
    const xi = skewNormalXi

    const erfApprox = (x: number): number => {
      const t = 1 / (1 + 0.3275911 * Math.abs(x))
      const y =
        1 -
        t *
          (0.254829592 +
            t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) *
          Math.exp(-x * x)
      return x >= 0 ? y : -y
    }
    const snPdf = (t: number) => Math.exp((-t * t) / 2) / Math.sqrt(2 * Math.PI)
    const snCdf = (t: number) => 0.5 * (1 + erfApprox(t / Math.sqrt(2)))

    for (let p = 0; p <= P; p += step) {
      const numerator = a * (1 - (S - T) / T)
      const term1 = (P + b) ** k - p ** k
      const term2 = (P + b) ** k

      const y1 = term1 !== 0 ? numerator / term1 : 0
      const y2 = term2 !== 0 ? numerator / term2 : 0
      const y = y1 - y2 + p

      const t = (p - xi) / sigma
      const density = (2 / sigma) * snPdf(t) * snCdf(alpha * t)

      data.push({
        p: Math.round(p),
        y: Number(y.toFixed(2)),
        yUsd: Number((y * (initialLiquidity > 0 ? initialStake / initialLiquidity : 0)).toFixed(4)),
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
  }, [a, b, k, P, T, S, initialStake, initialLiquidity, stdDeviation, skewness, skewNormalXi])

  // Chart data with both curves scaled by their respective multipliers from simulation
  const chartDataWithFinal = useMemo(() => {
    if (!simulation) return chartData

    const r0 = (p: number): number => {
      const t1 = (P + b) ** k - p ** k
      const t2 = (P + b) ** k
      return Math.max(0, (t1 !== 0 ? a / t1 : 0) - (t2 !== 0 ? a / t2 : 0) + p)
    }

    const initMult = simulation.initial.multiplierAt2
    const initPrice = simulation.initial.price
    const equilMult = simulation.equilibrium.multiplierAt2
    const equilPrice = simulation.equilibrium.price

    return chartData.map((d) => {
      const yTokens = r0(d.p) * initMult
      const yFinalTokens = r0(d.p) * equilMult
      return {
        ...d,
        yTokens: Math.round(yTokens),
        yUsd: Number((yTokens * initPrice).toFixed(4)),
        yFinalTokens: Math.round(yFinalTokens),
        yUsdFinal: Number((yFinalTokens * equilPrice).toFixed(4)),
      }
    })
  }, [chartData, simulation, a, b, k, P])

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
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={displayData}
                margin={{ top: 45, right: 30, left: 50, bottom: 20 }}
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
                Constant A:{' '}
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
                  { label: 'Decentralization', snap: simulation.teamShareSnap },
                  { label: 'Equilibrium', snap: simulation.equilibrium },
                  { label: 'ROI', snap: simulation.teamRevenueSnap },
                ]
                type Snap = typeof simulation.initial | null
                const redCells: Record<string, string[]> = {
                  Decentralization: ['Team share'],
                  Equilibrium: ['Burn', 'Avg reward'],
                  ROI: ['Team revenue'],
                }
                const greenCells: Record<string, string[]> = {
                  Initial: ['Break even'],
                  Decentralization: ['Break even'],
                  Equilibrium: ['Break even'],
                }
                const rows: {
                  key: string
                  label: ReactNode
                  textLabel?: string
                  render: (snap: Snap) => string
                }[] = [
                  {
                    key: 'Games',
                    label: 'Games',
                    render: (s) => (s == null ? '—' : fmtInt(s.games)),
                  },
                  {
                    key: 'Avg perf',
                    label: 'Avg perf',
                    render: (s) => (s == null ? '—' : fmt(s.avgPerformance, 3)),
                  },
                  {
                    key: 'Supply',
                    label: 'Supply',
                    render: (s) => (s == null ? '—' : fmtInt(s.supply)),
                  },
                  {
                    key: 'Team share',
                    label: 'Team share',
                    render: (s) =>
                      s == null
                        ? '—'
                        : s.treasurySharePct == null
                          ? 'N/A'
                          : `${fmt(s.treasurySharePct, 2)}%`,
                  },
                  {
                    key: 'Team revenue',
                    label: 'Team revenue',
                    render: (s) => (s == null ? '—' : `$${fmt(s.teamRevenue, 2)}`),
                  },
                  {
                    key: 'USD in pool',
                    label: 'USD in pool',
                    render: (s) => (s == null ? '—' : `$${fmt(s.usdInPool, 2)}`),
                  },
                  {
                    key: 'Price',
                    label: 'Price',
                    render: (s) => (s == null ? '—' : `$${fmt(s.price, 6)}`),
                  },
                  {
                    key: 'Paid',
                    label: `Paid at. $${entryFee}`,
                    render: (s) => (s == null ? '—' : fmt(s.paid, 4)),
                  },
                  {
                    key: 'Burn',
                    label: `Burn at. $${entryFee}`,
                    render: (s) => (s == null ? '—' : fmt(s.burn, 4)),
                  },
                  {
                    key: 'Avg burn',
                    textLabel: 'Mint at. p̄',
                    label: (
                      <span>
                        Mint at. <span style={{ textDecoration: 'overline' }}>p</span>
                      </span>
                    ),
                    render: (s) => (s == null ? '—' : fmt(s.r0AtEma, 4)),
                  },
                  {
                    key: 'alpha_s',
                    textLabel: 'αs',
                    label: (
                      <span>
                        α<sub>s</sub>
                      </span>
                    ),
                    render: (s) => (s == null ? '—' : fmt(s.alphaS, 4)),
                  },
                  {
                    key: 'alpha_b',
                    textLabel: 'αb',
                    label: (
                      <span>
                        α<sub>b</sub>
                      </span>
                    ),
                    render: (s) => (s == null ? '—' : fmt(s.alphaB, 4)),
                  },
                  {
                    key: 'Break even',
                    label: 'Break even',
                    render: (s) =>
                      s == null
                        ? '—'
                        : s.avgEquilibriumPerf == null
                          ? 'N/A'
                          : fmt(s.avgEquilibriumPerf, 2),
                  },
                  {
                    key: 'alpha',
                    label: 'α',
                    render: (s) => (s == null ? '—' : fmt(s.multiplierAt2, 4)),
                  },
                  {
                    key: 'Avg reward',
                    label: 'Avg reward',
                    render: (s) => (s == null ? '—' : fmt(s.avgReward, 4)),
                  },
                  {
                    key: 'Max reward',
                    label: 'Max reward',
                    render: (s) => (s == null ? '—' : `$${fmt(s.maxRewardUsd, 4)}`),
                  },
                ]
                const copyAsMarkdown = () => {
                  const header = `|  | ${cols.map((c) => c.label).join(' | ')} |`
                  const separator = `| --- | ${cols.map(() => '---').join(' | ')} |`
                  const rowLines = rows.map((row) => {
                    const tl =
                      row.textLabel ?? (typeof row.label === 'string' ? row.label : row.key)
                    const cells = cols.map((c) => row.render(c.snap))
                    return `| ${tl} | ${cells.join(' | ')} |`
                  })
                  navigator.clipboard
                    .writeText([header, separator, ...rowLines].join('\n'))
                    .then(() => {
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    })
                }

                return (
                  <div>
                    <div className="flex justify-end mb-1">
                      <button
                        type="button"
                        onClick={copyAsMarkdown}
                        className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                      >
                        {copied ? '✓ Copied' : 'Copy MD'}
                      </button>
                    </div>
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
                          <tr key={row.key} className="border-b border-border/50 last:border-0">
                            <td className="text-muted-foreground py-1 pr-2">{row.label}</td>
                            {cols.map((c) => {
                              const isRed = redCells[c.label]?.includes(row.key)
                              const isGreen = greenCells[c.label]?.includes(row.key)
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
            {simulation &&
              (() => {
                const totalSupply = S
                const usdInPool = simulation.initial.usdInPool
                // AMM K-preservation: S × X = initialLiquidity × usdInPool
                // → X = initialLiquidity × usdInPool / S
                const X = (initialLiquidity * usdInPool) / totalSupply
                const swapUsd = usdInPool - X
                const treasuryTokens = totalSupply - initialLiquidity
                const avgBuyPrice = treasuryTokens > 0 ? swapUsd / treasuryTokens : 0
                const fmtN = (n: number, d = 2) => n.toFixed(d)
                const fmtI = (n: number) =>
                  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
                return (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Initial launch
                    </p>
                    <table className="w-full text-xs border-collapse">
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="text-muted-foreground py-1 pr-2">
                            Initial token liquidity
                          </td>
                          <td className="font-mono font-semibold text-foreground py-1 px-2">
                            {fmtI(totalSupply)}
                          </td>
                          <td className="text-muted-foreground py-1 px-2 text-right">
                            (pool + team {fmtI(treasuryTokens)})
                          </td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="text-muted-foreground py-1 pr-2">Initial USD liquidity</td>
                          <td className="font-mono font-semibold text-foreground py-1 px-2">
                            ${fmtN(X)}
                          </td>
                          <td className="text-muted-foreground py-1 px-2 text-right">
                            (@ ${fmtN(totalSupply > 0 ? X / totalSupply : 0, 6)}/token)
                          </td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="text-muted-foreground py-1 pr-2">Swap / DCA in</td>
                          <td className="font-mono font-semibold text-foreground py-1 px-2">
                            ${fmtN(swapUsd)}
                          </td>
                          <td className="text-muted-foreground py-1 px-2 text-right">
                            (avg @ ${fmtN(avgBuyPrice, 6)}/token)
                          </td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="text-muted-foreground py-1 pr-2">Token liquidity</td>
                          <td className="font-mono font-semibold text-foreground py-1 px-2">
                            {fmtI(initialLiquidity)}
                          </td>
                          <td className="text-muted-foreground py-1 px-2 text-right">
                            ({fmtI(treasuryTokens)} extracted)
                          </td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground py-1 pr-2">USD liquidity</td>
                          <td className="font-mono font-semibold text-foreground py-1 px-2">
                            ${fmtN(usdInPool)}
                          </td>
                          <td className="text-muted-foreground py-1 px-2 text-right">
                            (@ ${fmtN(initialLiquidity > 0 ? usdInPool / initialLiquidity : 0, 6)}
                            /token)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            {simulation &&
              (() => {
                const total = simulation.perfCounts.reduce((a, b) => a + b, 0)
                const totalTheo = chartData.reduce((s, d) => s + d.distributionDensity, 0)
                const histData = simulation.perfCounts.map((count, p) => ({
                  p,
                  count,
                  empirical: total > 0 ? count / total : 0,
                  theoretical:
                    totalTheo > 0 ? (chartData[p]?.distributionDensity ?? 0) / totalTheo : 0,
                }))
                return (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Performance distribution
                    </p>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart
                        data={histData}
                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="p" tick={{ fontSize: 10 }} interval={1} />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0].payload as { count: number }
                            return (
                              <div className="bg-background/95 border border-border rounded px-2 py-1.5 text-xs shadow">
                                <p className="font-medium mb-1">p = {label}</p>
                                {payload.map((entry) => (
                                  <p key={entry.dataKey as string} style={{ color: entry.color }}>
                                    {entry.dataKey === 'empirical'
                                      ? `Observed: ${((entry.value as number) * 100).toFixed(2)}% (${new Intl.NumberFormat('en-US').format(d.count)})`
                                      : `Theoretical: ${((entry.value as number) * 100).toFixed(2)}%`}
                                  </p>
                                ))}
                              </div>
                            )
                          }}
                        />
                        <Bar
                          dataKey="empirical"
                          fill="#7c3aed"
                          opacity={0.6}
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="theoretical"
                          stroke="#ef4444"
                          strokeWidth={1.5}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              })()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
