import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Globe2 } from 'lucide-react'
import type { TopCountry } from '../types'
import { Section } from './ui/Section'
import { countryCodeToFlag, formatNumber } from '../lib/format'

interface CountriesChartProps {
  data: TopCountry[] | null
  loading: boolean
  error: Error | null
  onRetry?: () => void
}

interface Row extends TopCountry {
  label: string
}

export function CountriesChart({ data, loading, error, onRetry }: CountriesChartProps) {
  const rows = useMemo<Row[]>(() => {
    if (!data) return []
    return data.map((c) => ({
      ...c,
      label: `${countryCodeToFlag(c.country_code)} ${c.country_code || '??'}`,
    }))
  }, [data])

  return (
    <Section
      title="Top countries"
      description="Sessions by source country"
      icon={<Globe2 className="h-4 w-4" />}
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeletonRows={6}
    >
      {rows.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-slate-500">
          No data yet.
        </div>
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
              width={64}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <Tooltip cursor={{ fill: 'rgba(148,163,184,0.08)' }} content={<CountryTooltip />} />
            <Bar
              dataKey="sessions"
              fill="#6366f1"
              radius={[0, 4, 4, 0]}
              maxBarSize={22}
              label={<ValueLabel />}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Section>
  )
}

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

function CountryTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const c = payload[0].payload as Row
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-slate-100">
        {countryCodeToFlag(c.country_code)} {c.country}
      </div>
      <div className="text-slate-300">{formatNumber(c.sessions)} sessions</div>
      <div className="text-slate-400">{formatNumber(c.unique_ips)} unique IPs</div>
    </div>
  )
}
