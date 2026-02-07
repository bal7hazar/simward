import { RewardChart } from '@/components/reward-chart'
import { SimulationInputs } from '@/components/simulation-inputs'
import { useState } from 'react'

function App() {
  const [params, setParams] = useState({
    a: 270000000,
    k: 5,
    P: 23,
    T: 1000000000,
    S: 1000000000,
  })

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
            Simward
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Simulateur de courbes de reward pour jeux
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <SimulationInputs params={params} onParamChange={handleParamChange} />
          </div>
          <div className="lg:col-span-2">
            <RewardChart params={params} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
