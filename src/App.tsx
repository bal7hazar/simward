import { RewardChart } from '@/components/reward-chart'
import { SimulationInputs } from '@/components/simulation-inputs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { useState } from 'react'

function App() {
  const [showCumulative, setShowCumulative] = useState(true)
  const [params, setParams] = useState({
    maxReward: 300000,
    b: 2,
    k: 10,
    P: 18,
    T: 100_000_000,
    S: 100_000_000,
    price: 0.0001,
    entryFee: 2.0,
    avgPerformance: 14,
    stdDeviation: 1.5,
  })

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'P') {
        if (prev.b > value) next.b = value
        if (prev.avgPerformance > value) next.avgPerformance = value
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
                <div className="text-center text-lg p-4 bg-muted rounded-lg">
                  <InlineMath
                    math={String.raw`y = a \cdot \frac{1 - \frac{S - T}{T}}{(P+b)^k - p^k} - \frac{a \cdot (1 - \frac{S - T}{T})}{(P+b)^k}`}
                  />
                </div>
              </CardContent>
            </Card>
            <SimulationInputs params={params} onParamChange={handleParamChange} />
          </div>
          <div className="h-full flex-[2]">
            <RewardChart
              params={params}
              showCumulative={showCumulative}
              onShowCumulativeChange={setShowCumulative}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
