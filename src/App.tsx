import { ExampleChart } from '@/components/example-chart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
            Simward
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Votre application web hébergée sur GitHub Pages
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Bienvenue</CardTitle>
              <CardDescription>
                Votre projet est configuré avec React, Vite, TailwindCSS et Shadcn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">React 18</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Vite</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">TailwindCSS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Shadcn UI</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Recharts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Biome</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Turbo</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exemple de Graphique</CardTitle>
              <CardDescription>Recharts intégré et prêt à utiliser</CardDescription>
            </CardHeader>
            <CardContent>
              <ExampleChart />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Compteur Interactif</CardTitle>
            <CardDescription>Exemple de composant React avec état</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button onClick={() => setCount(count - 1)} variant="outline">
                -
              </Button>
              <div className="text-4xl font-bold tabular-nums min-w-[100px] text-center">
                {count}
              </div>
              <Button onClick={() => setCount(count + 1)}>+</Button>
              <Button onClick={() => setCount(0)} variant="ghost">
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App
