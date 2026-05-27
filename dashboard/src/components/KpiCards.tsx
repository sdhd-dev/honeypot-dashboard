import {
  Activity,
  Network,
  Globe2,
  KeyRound,
  Bug,
  type LucideIcon,
} from 'lucide-react'
import type { StatsSummary } from '../types'
import { formatNumber } from '../lib/format'
import { Skeleton } from './ui/Skeleton'

interface KpiCardsProps {
  summary: StatsSummary | null
  loading: boolean
}

interface CardDef {
  label: string
  value: number | undefined
  sublabel?: string
  icon: LucideIcon
  accent: string
}

export function KpiCards({ summary, loading }: KpiCardsProps) {
  const cards: CardDef[] = [
    {
      label: 'Total sessions',
      value: summary?.total_sessions,
      icon: Activity,
      accent: 'text-blue-400 bg-blue-500/10',
    },
    {
      label: 'Unique IPs',
      value: summary?.unique_ips,
      icon: Network,
      accent: 'text-indigo-400 bg-indigo-500/10',
    },
    {
      label: 'Countries',
      value: summary?.countries,
      icon: Globe2,
      accent: 'text-cyan-400 bg-cyan-500/10',
    },
    {
      label: 'Login attempts',
      value: summary?.total_logins,
      sublabel:
        summary != null
          ? `${formatNumber(summary.successful_logins)} succeeded`
          : undefined,
      icon: KeyRound,
      accent: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      label: 'Malware files',
      value: summary?.total_downloads,
      icon: Bug,
      accent: 'text-rose-400 bg-rose-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-1 hover:border-slate-700 hover:shadow-xl hover:shadow-black/30"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {card.label}
            </span>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.accent}`}
            >
              <card.icon className="h-4 w-4" />
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
              {formatNumber(card.value)}
            </div>
          )}
          <div className="mt-1 h-4 text-xs text-slate-500">
            {!loading && card.sublabel}
          </div>
        </div>
      ))}
    </div>
  )
}
