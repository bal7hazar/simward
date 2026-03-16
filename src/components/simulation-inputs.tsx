import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type React from 'react'

interface SimulationInputsProps {
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
  }
  onParamChange: (key: string, value: number) => void
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
        {title}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function NumberRow({
  id,
  label,
  value,
  step,
  onChange,
}: {
  id: string
  label: string
  value: number
  step: string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <Label htmlFor={id} className="text-sm font-medium w-36 shrink-0">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)}
        className="flex-1 h-8 text-sm"
      />
    </div>
  )
}

function LogSliderRow({
  id,
  label,
  max,
  value,
  onChange,
}: {
  id: string
  label: string
  max: number
  value: number
  onChange: (v: number) => void
}) {
  const STEPS = 1000

  const toInternal = (v: number) => {
    if (v <= 0 || max <= 0) return 0
    if (v >= max) return STEPS
    return Math.round((Math.log(v) / Math.log(max)) * STEPS)
  }

  const fromInternal = (internal: number) => {
    if (internal <= 0) return 0
    if (internal >= STEPS) return max
    return Math.round(max ** (internal / STEPS))
  }

  return (
    <div className="flex items-center gap-3">
      <Label htmlFor={id} className="text-sm font-medium w-36 shrink-0">
        {label}
      </Label>
      <div className="flex-1 flex items-center gap-2">
        <Slider
          id={id}
          min={0}
          max={STEPS}
          step={1}
          value={[toInternal(value)]}
          onValueChange={(values) => onChange(fromInternal(values[0]))}
          className="flex-1"
        />
        <span className="text-xs font-medium text-foreground w-16 text-right tabular-nums">
          {value}
        </span>
      </div>
    </div>
  )
}

function SliderRow({
  id,
  label,
  min,
  max,
  step,
  value,
  format,
  onChange,
}: {
  id: string
  label: React.ReactNode
  min: number
  max: number
  step: number
  value: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <Label htmlFor={id} className="text-sm font-medium w-36 shrink-0">
        {label}
      </Label>
      <div className="flex-1 flex items-center gap-2">
        <Slider
          id={id}
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          className="flex-1"
        />
        <span className="text-xs font-medium text-foreground w-16 text-right tabular-nums">
          {format(value)}
        </span>
      </div>
    </div>
  )
}

export function SimulationInputs({ params, onParamChange }: SimulationInputsProps) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n)

  return (
    <Card className="h-full min-h-0 overflow-hidden flex flex-col">
      <CardHeader>
        <CardTitle>Parameters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 overflow-y-auto h-full min-h-0 scrollbar-hide">
        {/* ── Curve shape ──────────────────────────────────────── */}
        <SectionHeader title="Curve shape" />

        <NumberRow
          id="maxReward"
          label="Max Reward"
          value={params.maxReward}
          step="1"
          onChange={(v) => onParamChange('maxReward', v)}
        />
        <NumberRow
          id="k"
          label="Constant k"
          value={params.k}
          step="1"
          onChange={(v) => onParamChange('k', v)}
        />
        <NumberRow
          id="P"
          label="Max Performance (P)"
          value={params.P}
          step="1"
          onChange={(v) => onParamChange('P', v)}
        />
        <SliderRow
          id="b-slider"
          label="Constant b"
          min={0}
          max={params.P}
          step={1}
          value={params.b}
          format={(v) => String(Math.round(v))}
          onChange={(v) => onParamChange('b', Math.round(v))}
        />

        {/* ── Model ────────────────────────────────────────────── */}
        <SectionHeader title="Model" />

        <SliderRow
          id="entryFee"
          label="Stake (USD)"
          min={2}
          max={20}
          step={1}
          value={params.entryFee}
          format={(v) => `$${Math.round(v)}`}
          onChange={(v) => onParamChange('entryFee', v)}
        />
        <NumberRow
          id="initialPerformance"
          label="Initial Performance"
          value={params.initialPerformance}
          step="0.1"
          onChange={(v) => onParamChange('initialPerformance', v)}
        />
        <NumberRow
          id="finalPerformance"
          label="Final Performance"
          value={params.finalPerformance}
          step="0.1"
          onChange={(v) => onParamChange('finalPerformance', v)}
        />
        <NumberRow
          id="emaMaxWeight"
          label="EMA Max Weight"
          value={params.emaMaxWeight}
          step="1"
          onChange={(v) => onParamChange('emaMaxWeight', v)}
        />
        <LogSliderRow
          id="ema-initial-weight-slider"
          label="EMA Initial Weight"
          max={params.emaMaxWeight}
          value={params.emaInitialWeight}
          onChange={(v) => onParamChange('emaInitialWeight', v)}
        />
        <SliderRow
          id="buyback-slider"
          label={
            <>
              Burn Ratio (τ<sub>b</sub>)
            </>
          }
          min={0}
          max={100}
          step={1}
          value={params.buybackBurnRatio}
          format={(v) => `${Math.round(v)}%`}
          onChange={(v) => onParamChange('buybackBurnRatio', v)}
        />
        <SliderRow
          id="t-slider"
          label="Target Supply (T)"
          min={0}
          max={10_000_000}
          step={100_000}
          value={params.T}
          format={(v) => fmt(Math.round(v))}
          onChange={(v) => onParamChange('T', v)}
        />

        {/* ── Initial state ────────────────────────────────────── */}
        <SectionHeader title="Initial state" />

        <SliderRow
          id="stake-slider"
          label="Initial Stake (USD)"
          min={0}
          max={50_000}
          step={1_000}
          value={params.initialStake}
          format={(v) => `$${fmt(Math.round(v))}`}
          onChange={(v) => onParamChange('initialStake', v)}
        />
        <SliderRow
          id="supply-slider"
          label="Initial Supply"
          min={0}
          max={10_000_000}
          step={100_000}
          value={params.initialSupply}
          format={(v) => fmt(Math.round(v))}
          onChange={(v) => onParamChange('initialSupply', v)}
        />
        <SliderRow
          id="liquidity-slider"
          label="Initial Liquidity"
          min={0}
          max={params.initialSupply}
          step={100_000}
          value={params.initialLiquidity}
          format={(v) => fmt(Math.round(v))}
          onChange={(v) => onParamChange('initialLiquidity', v)}
        />
        <SliderRow
          id="swap-fee-slider"
          label="Swap Fee"
          min={0}
          max={100}
          step={1}
          value={params.swapFee}
          format={(v) => `${Math.round(v)}%`}
          onChange={(v) => onParamChange('swapFee', v)}
        />

        {/* ── Miscellaneous ────────────────────────────────────── */}
        <SectionHeader title="Miscellaneous" />

        <SliderRow
          id="std-slider"
          label="Std Deviation"
          min={0.1}
          max={params.P / 2}
          step={0.1}
          value={params.stdDeviation}
          format={(v) => v.toFixed(1)}
          onChange={(v) => onParamChange('stdDeviation', v)}
        />
      </CardContent>
    </Card>
  )
}
