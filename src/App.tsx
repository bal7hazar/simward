import { RewardChart } from '@/components/reward-chart'
import { SimulationInputs } from '@/components/simulation-inputs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { useState } from 'react'

const defaultParams = {
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
  beta: 1,
}

const presets: { name: string; params: typeof defaultParams }[] = [
  { name: 'Nums', params: { ...defaultParams } },
  {
    name: 'Glitch Bomb',
    params: {
      ...defaultParams,
      beta: 0,
      k: 1,
      b: 162,
      initialPerformance: 148,
      P: 524,
      finalPerformance: 148,
      stdDeviation: 148,
      skewness: 4,
    },
  },
]

function App() {
  const [params, setParams] = useState(defaultParams)
  const [selectedPreset, setSelectedPreset] = useState('Nums')

  const handleParamChange = (key: string, value: number) => {
    setSelectedPreset('')
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

  const handlePresetChange = (name: string) => {
    const preset = presets.find((p) => p.name === name)
    if (preset) {
      setParams(preset.params)
      setSelectedPreset(name)
    }
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
                <div className="flex items-center justify-between">
                  <CardTitle>Formula</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Preset</span>
                    <select
                      value={selectedPreset}
                      onChange={(e) => handlePresetChange(e.target.value)}
                      className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {selectedPreset === '' && <option value="">Custom</option>}
                      {presets.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center text-base p-4 bg-muted rounded-lg overflow-x-auto [&_.katex]:text-base">
                  <BlockMath
                    math={String.raw`
\begin{aligned}
r_0(p) &= A \cdot \left(\frac{1}{(P+b)^k - p^k} - \frac{1}{(P+b)^k}\right) + \beta p \\
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
