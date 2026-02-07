import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Fév', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Avr', value: 800 },
  { name: 'Mai', value: 500 },
  { name: 'Jun', value: 900 },
]

export function ExampleChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
