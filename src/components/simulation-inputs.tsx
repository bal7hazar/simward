import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

interface SimulationInputsProps {
  params: {
    a: number
    b: number
    k: number
    P: number
    T: number
    S: number
  }
  onParamChange: (key: string, value: number) => void
}

export function SimulationInputs({ params, onParamChange }: SimulationInputsProps) {
  const maxA = 10_000_000_000 // 10 billion

  const inputs = [
    { key: 'k', label: 'Constant k', description: 'Customization exponent' },
    { key: 'P', label: 'Max Performance (P)', description: 'Maximum performance value' },
    { key: 'T', label: 'Target (T)', description: 'Target value' },
    { key: 'S', label: 'Current Value (S)', description: 'Current value' },
  ]

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Parameters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Slider for constant a */}
        <div className="space-y-3">
          <Label htmlFor="a-slider" className="text-sm font-medium">
            Constant a
          </Label>
          <div className="space-y-2">
            <Slider
              id="a-slider"
              min={0}
              max={maxA}
              step={1_000_000}
              value={[params.a]}
              onValueChange={(values) => onParamChange('a', values[0])}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span className="font-medium text-foreground">{formatNumber(params.a)}</span>
              <span>10B</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Customization factor</p>
        </div>

        {/* Slider for constant b */}
        <div className="space-y-3">
          <Label htmlFor="b-slider" className="text-sm font-medium">
            Constant b
          </Label>
          <div className="space-y-2">
            <Slider
              id="b-slider"
              min={0}
              max={10}
              step={1}
              value={[params.b]}
              onValueChange={(values) => onParamChange('b', values[0])}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span className="font-medium text-foreground">{params.b}</span>
              <span>10</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Performance offset</p>
        </div>

        {/* Regular inputs for other params */}
        {inputs.map(({ key, label, description }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="text-sm font-medium">
              {label}
            </Label>
            <Input
              id={key}
              type="number"
              step="0.1"
              value={params[key as keyof typeof params]}
              onChange={(e) => onParamChange(key, Number.parseFloat(e.target.value) || 0)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
