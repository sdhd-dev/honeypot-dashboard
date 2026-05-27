import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { Clock } from 'lucide-react'
import type { TimelinePoint } from '../types'
import { Section } from './ui/Section'
import { formatNumber } from '../lib/format'

interface TimelineChartProps {
  data: TimelinePoint[] | null
  loading: boolean
  error: Error | null
  onRetry?: () => void
}

interface Point {
  time: string
  label: string
  sessions: number
}

export function TimelineChart({ data, loading, error, onRetry }: TimelineChartProps) {
  const points = useMemo<Point[]>(() => {
    if (!data) return []
    return data.map((d) => {
      let label = d.hour
      try {
        label = format(parseISO(d.hour), 'HH:mm')
      } catch {
        /* keep raw */
      }
      return { time: d.hour, label, sessions: d.sessions }
    })
  }, [data])

  const total = points.reduce((sum, p) => sum + p.sessions, 0)
  const peak = points.reduce((max, p) => Math.max(max, p.sessions), 0)

  return (
    <Section
      title="Attack timeline"
      description="Sessions per hour over the last 24 hours"
      icon={<Clock className="h-4 w-4" />}
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeletonRows={1}
      action={
        <div className="text-right text-xs text-slate-500">
          <span className="font-semibold text-slate-300">{formatNumber(total)}</span>{' '}
          sessions · peak <span className="text-slate-300">{formatNumber(peak)}</span>/h
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={points} margin={{ top: 10, right: 12, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#1e293b' }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={40}
          />
          <Tooltip content={<TimelineTooltip />} />
          <Area
            type="monotone"
            dataKey="sessions"
            stroke="#60a5fa"
            strokeWidth={2}
            fill="url(#timelineFill)"
            activeDot={{ r: 4, fill: '#60a5fa', stroke: '#0f172a', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Section>
  )
}

function TimelineTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload as Point
  let full = p.label
  try {
    full = format(parseISO(p.time), 'MMM d, HH:mm')
  } catch {
    /* keep */
  }
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400">{full}</div>
      <div className="font-semibold text-slate-100">
        {formatNumber(p.sessions)} sessions
      </div>
    </div>
  )
}
