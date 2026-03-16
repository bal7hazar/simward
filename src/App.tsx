import { RewardChart } from '@/components/reward-chart'
import { SimulationInputs } from '@/components/simulation-inputs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { useState } from 'react'

function App() {
  const [params, setParams] = useState({
    maxReward: 300,
    b: 2,
    k: 5,
    P: 18,
    emaMaxWeight: 1000,
    emaInitialWeight: 100,
    entryFee: 2.0,
    buybackBurnRatio: 70,
    swapFee: 5,
    T: 1_000_000,
    initialPerformance: 10,
    initialStake: 10_000,
    initialSupply: 1_000_000,
    initialLiquidity: 800_000,
    finalPerformance: 13,
    stdDeviation: 4,
    skewness: -4,
  })

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'P') {
        if (prev.b > value) next.b = value
        if (prev.finalPerformance > value) next.finalPerformance = value
        if (prev.initialPerformance > value) next.initialPerformance = value
      }
      if (key === 'buybackBurnRatio') {
        next.buybackBurnRatio = Math.max(0, Math.min(100, Math.round(value)))
      }
      if (key === 'swapFee') {
        next.swapFee = Math.max(0, Math.min(100, Math.round(value)))
      }
      if (key === 'initialSupply') {
        if (prev.initialLiquidity > value) next.initialLiquidity = value
      }
      return next
    })
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 overflow-hidden">
      <div className="flex flex-col h-full p-8 overflow-hidden">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
            Simward
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Reward curve simulator for games</p>
        </div>

        <div className="h-full flex gap-6 overflow-hidden">
          <div className="flex-[1] h-full flex flex-col gap-6 overflow-hidden min-h-0">
            <Card>
              <CardHeader>
                <CardTitle>Formula</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-base p-4 bg-muted rounded-lg overflow-x-auto [&_.katex]:text-base">
                  <BlockMath
                    math={String.raw`
\begin{aligned}
r_0(p) &= A \cdot \left(\frac{1}{(P+b)^k - p^k} - \frac{1}{(P+b)^k}\right) + p \\
\alpha_s &= \frac{2T - S}{T} \\
\alpha_b(\text{burn}) &= \frac{\text{burn}}{r_0(\bar{p})} \\
\boldsymbol{r(p,\text{burn})} &= \boldsymbol{\alpha_s \cdot \alpha_b(\text{burn}) \cdot r_0(p) = \alpha \cdot r_0(p)}
\end{aligned}
`}
                  />
                </div>
              </CardContent>
            </Card>
            <SimulationInputs params={params} onParamChange={handleParamChange} />
          </div>
          <div className="h-full flex-[2]">
            <RewardChart params={params} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
