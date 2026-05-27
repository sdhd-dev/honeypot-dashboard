import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ReactNode } from 'react'
import { Section } from './ui/Section'
import { formatNumber, isCrypto } from '../lib/format'

interface ChartRow {
  label: string
  value: number
  crypto: boolean
}

interface CredentialChartProps<T> {
  title: string
  description?: string
  icon?: ReactNode
  data: T[] | null
  loading: boolean
  error: Error | null
  onRetry?: () => void
  /** Field holding the label (e.g. "password" or "username"). */
  labelKey: keyof T
  /** Field holding the count (e.g. "attempts"). */
  valueKey: keyof T
}

const BAR_COLOR = '#3b82f6' // blue-500
const CRYPTO_COLOR = '#f59e0b' // amber-500

export function CredentialChart<T>({
  title,
  description,
  icon,
  data,
  loading,
  error,
  onRetry,
  labelKey,
  valueKey,
}: CredentialChartProps<T>) {
  const rows = useMemo<ChartRow[]>(() => {
    if (!data) return []
    return data.map((d) => {
      const label = String(d[labelKey] ?? '∅')
      return {
        label: label === '' ? '∅ (empty)' : label,
        value: Number(d[valueKey] ?? 0),
        crypto: isCrypto(label),
      }
    })
  }, [data, labelKey, valueKey])

  const hasCrypto = rows.some((r) => r.crypto)

  return (
    <Section
      title={title}
      description={description}
      icon={icon}
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeletonRows={6}
      action={
        hasCrypto ? (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            crypto-related
          </span>
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <EmptyHint />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(rows.length * 34, 200)}>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 0, right: 48, bottom: 0, left: 8 }}
            barCategoryGap={6}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={110}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148,163,184,0.08)' }}
              content={<CredentialTooltip />}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22} label={<ValueLabel />}>
              {rows.map((row, i) => (
                <Cell key={i} fill={row.crypto ? CRYPTO_COLOR : BAR_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Section>
  )
}

/** Renders the count just past the end of each bar. */
function ValueLabel(props: any) {
  const { x, y, width, height, value } = props
  return (
    <text
      x={x + width + 6}
      y={y + height / 2}
      fill="#cbd5e1"
      fontSize={11}
      textAnchor="start"
      dominantBaseline="central"
    >
      {formatNumber(value)}
    </text>
  )
}

function CredentialTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload as ChartRow
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs shadow-xl">
      <div className="font-mono font-semibold text-slate-100">{row.label}</div>
      <div className="text-slate-300">
        {formatNumber(row.value)} attempts
        {row.crypto && <span className="ml-1.5 text-amber-400">· crypto</span>}
      </div>
    </div>
  )
}

function EmptyHint() {
  return (
    <div className="flex h-32 items-center justify-center text-sm text-slate-500">
      No data yet.
    </div>
  )
}
