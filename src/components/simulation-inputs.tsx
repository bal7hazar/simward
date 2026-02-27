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
    treasuryShare: number
    buybackBurnRatio: number
    initialLiquidity: number
    price: number
    entryFee: number
    avgPerformance: number
    stdDeviation: number
  }
  onParamChange: (key: string, value: number) => void
}

export function SimulationInputs({ params, onParamChange }: SimulationInputsProps) {
  const inputs = [
    { key: 'entryFee', label: 'Entry Fee (USD)', description: 'Entry fee in USD' },
    { key: 'maxReward', label: 'Max Reward', description: 'Reward at maximum performance' },
    { key: 'k', label: 'Constant k', description: 'Customization exponent' },
    { key: 'P', label: 'Max Performance (P)', description: 'Maximum performance value' },
    { key: 'price', label: 'Initial Price (USD)', description: 'Initial price per token in pool' },
  ]

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <Card className="h-full min-h-0 overflow-hidden flex flex-col">
      <CardHeader>
        <CardTitle>Parameters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 overflow-y-auto h-full min-h-0 scrollbar-hide">
        {/* Entry Fee, Max Reward, k, P */}
        {inputs
          .filter((input) => ['entryFee', 'maxReward', 'k', 'P'].includes(input.key))
          .map(({ key, label, description }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-sm font-medium">
                {label}
              </Label>
              <Input
                id={key}
                type="number"
                step={key === 'maxReward' ? '1' : key === 'entryFee' ? '0.01' : '0.1'}
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
              step={1}
              value={[params.b]}
              onValueChange={(values) => onParamChange('b', Math.round(values[0]))}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span className="font-medium text-foreground">{Math.round(params.b)}</span>
              <span>{params.P}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Performance offset (0 to Max Performance)</p>
        </div>

        {/* Average performance input */}
        <div className="space-y-2">
          <Label htmlFor="avgPerformance" className="text-sm font-medium">
            Average performance
          </Label>
          <Input
            id="avgPerformance"
            type="number"
            step="0.1"
            min={0}
            max={params.P}
            value={params.avgPerformance}
            onChange={(e) =>
              onParamChange('avgPerformance', Number.parseFloat(e.target.value) || 0)
            }
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">Mean of population distribution (μ)</p>
        </div>

        {/* Standard deviation slider */}
        <div className="space-y-3">
          <Label htmlFor="std-slider" className="text-sm font-medium">
            Standard deviation
          </Label>
          <div className="space-y-2">
            <Slider
              id="std-slider"
              min={0.1}
              max={params.P / 2}
              step={0.1}
              value={[params.stdDeviation]}
              onValueChange={(values) => onParamChange('stdDeviation', values[0])}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0.1</span>
              <span className="font-medium text-foreground">{params.stdDeviation.toFixed(1)}</span>
              <span>{params.P / 2}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Spread of population distribution (σ)</p>
        </div>

        {/* Target Supply slider (0 to 1B, step 1M) */}
        <div className="space-y-3">
          <Label htmlFor="t-slider" className="text-sm font-medium">
            Target Supply (T)
          </Label>
          <div className="space-y-2">
            <Slider
              id="t-slider"
              min={0}
              max={1_000_000_000}
              step={5_000_000}
              value={[params.T]}
              onValueChange={(values) => onParamChange('T', values[0])}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span className="font-medium text-foreground">
                {formatNumber(Math.round(params.T))}
              </span>
              <span>{formatNumber(1_000_000_000)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Target supply (0 to 1B, step 5M)</p>
        </div>

        {/* Initial liquidity slider */}
        <div className="space-y-3">
          <Label htmlFor="liquidity-slider" className="text-sm font-medium">
            Initial liquidity (pool)
          </Label>
          <div className="space-y-2">
            <Slider
              id="liquidity-slider"
              min={0}
              max={params.T * 2}
              step={1_000_000}
              value={[params.initialLiquidity]}
              onValueChange={(values) => onParamChange('initialLiquidity', values[0])}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span className="font-medium text-foreground">
                {formatNumber(Math.round(params.initialLiquidity))}
              </span>
              <span>{formatNumber(params.T * 2)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Token liquidity in pool (0 to 2× Target, step 1M)
          </p>
        </div>

        {/* Treasury share slider (0% to 100%, step 1%) */}
        <div className="space-y-3">
          <Label htmlFor="treasury-slider" className="text-sm font-medium">
            Treasury share
          </Label>
          <div className="space-y-2">
            <Slider
              id="treasury-slider"
              min={0}
              max={100}
              step={1}
              value={[params.treasuryShare]}
              onValueChange={(values) => onParamChange('treasuryShare', values[0])}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="font-medium text-foreground">{params.treasuryShare}%</span>
              <span>100%</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Treasury share (0–100%, step 1%)</p>
        </div>

        {/* Burn ratio slider (0% to 100%, step 1%) */}
        <div className="space-y-3">
          <Label htmlFor="buyback-slider" className="text-sm font-medium">
            Burn ratio
          </Label>
          <div className="space-y-2">
            <Slider
              id="buyback-slider"
              min={0}
              max={100}
              step={1}
              value={[params.buybackBurnRatio]}
              onValueChange={(values) => onParamChange('buybackBurnRatio', values[0])}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="font-medium text-foreground">{params.buybackBurnRatio}%</span>
              <span>100%</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Burn ratio (0–100%, step 1%)</p>
        </div>

        {/* Price input */}
        {inputs
          .filter((input) => input.key === 'price')
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
