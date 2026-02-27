import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

interface SimulationInputsProps {
  params: {
    maxReward: number
    b: number
    k: number
    P: number
    T: number
    S: number
    price: number
    entryFee: number
  }
  onParamChange: (key: string, value: number) => void
}

export function SimulationInputs({ params, onParamChange }: SimulationInputsProps) {
  const inputs = [
    { key: 'maxReward', label: 'Max Reward', description: 'Reward at maximum performance' },
    { key: 'k', label: 'Constant k', description: 'Customization exponent' },
    { key: 'P', label: 'Max Performance (P)', description: 'Maximum performance value' },
    { key: 'T', label: 'Target Supply (T)', description: 'Target supply value' },
    { key: 'price', label: 'Price (USD)', description: 'Price per reward token in USD' },
    { key: 'entryFee', label: 'Entry Fee (USD)', description: 'Entry fee in USD' },
  ]

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  // Calculate constant 'a' from maxReward
  // Assuming S = T, formula simplifies to: a = maxReward / [1/((P+b)^k - P^k) - 1/(P+b)^k]
  const calculateA = (): number => {
    const { maxReward, b, k, P } = params
    const term1 = (P + b) ** k - P ** k
    const term2 = (P + b) ** k

    if (term1 === 0 || term2 === 0) return 0

    const denominator = 1 / term1 - 1 / term2
    if (denominator === 0) return 0

    return maxReward / denominator
  }

  const calculatedA = calculateA()

  return (
    <Card className="h-full min-h-0 overflow-hidden flex flex-col">
      <CardHeader>
        <CardTitle>Parameters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 overflow-y-auto h-full min-h-0 scrollbar-hide">
        {/* Display calculated constant a (read-only) */}
        <div className="space-y-2 p-3 bg-muted rounded-lg">
          <Label className="text-sm font-medium">Constant a (calculated)</Label>
          <p className="text-lg font-mono font-semibold">{formatNumber(Math.round(calculatedA))}</p>
          <p className="text-xs text-muted-foreground">Automatically calculated from Max Reward</p>
        </div>

        {/* Regular inputs: maxReward, k, P */}
        {inputs
          .filter((input) => ['maxReward', 'k', 'P'].includes(input.key))
          .map(({ key, label, description }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-sm font-medium">
                {label}
              </Label>
              <Input
                id={key}
                type="number"
                step={key === 'maxReward' ? '1' : '0.1'}
                value={params[key as keyof typeof params]}
                onChange={(e) => onParamChange(key, Number.parseFloat(e.target.value) || 0)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          ))}

        {/* Slider for constant b (range 0 to Max Performance) */}
        <div className="space-y-3">
          <Label htmlFor="b-slider" className="text-sm font-medium">
            Constant b
          </Label>
          <div className="space-y-2">
            <Slider
              id="b-slider"
              min={0}
              max={params.P}
              step={Math.max(0.1, params.P / 50)}
              value={[params.b]}
              onValueChange={(values) => onParamChange('b', values[0])}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span className="font-medium text-foreground">{params.b}</span>
              <span>{params.P}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Performance offset (0 to Max Performance)</p>
        </div>

        {/* Target Supply input */}
        <div className="space-y-2">
          <Label htmlFor="T" className="text-sm font-medium">
            Target Supply (T)
          </Label>
          <Input
            id="T"
            type="number"
            step="0.1"
            value={params.T}
            onChange={(e) => onParamChange('T', Number.parseFloat(e.target.value) || 0)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">Target supply value</p>
        </div>

        {/* Slider for Current Supply (S) */}
        <div className="space-y-3">
          <Label htmlFor="s-slider" className="text-sm font-medium">
            Current Supply (S)
          </Label>
          <div className="space-y-2">
            <Slider
              id="s-slider"
              min={0}
              max={params.T * 2}
              step={params.T / 100}
              value={[params.S]}
              onValueChange={(values) => onParamChange('S', values[0])}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span className="font-medium text-foreground">
                {formatNumber(Math.round(params.S))}
              </span>
              <span>{formatNumber(params.T * 2)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Current supply value (0 to 2× Target)</p>
        </div>

        {/* Remaining inputs (price, entryFee) */}
        {inputs
          .filter((input) => ['price', 'entryFee'].includes(input.key))
          .map(({ key, label, description }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-sm font-medium">
                {label}
              </Label>
              <Input
                id={key}
                type="number"
                step={key === 'price' ? '0.0001' : '0.01'}
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
