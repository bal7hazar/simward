import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SimulationInputsProps {
  params: {
    a: number
    k: number
    P: number
    T: number
    S: number
  }
  onParamChange: (key: string, value: number) => void
}

export function SimulationInputs({ params, onParamChange }: SimulationInputsProps) {
  const inputs = [
    { key: 'a', label: 'Constant a', description: 'Customization factor' },
    { key: 'k', label: 'Constant k', description: 'Customization exponent' },
    { key: 'P', label: 'Max Performance (P)', description: 'Maximum performance value' },
    { key: 'T', label: 'Target (T)', description: 'Target value' },
    { key: 'S', label: 'Current Value (S)', description: 'Current value' },
  ]

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Parameters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
