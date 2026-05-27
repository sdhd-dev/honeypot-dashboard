import { Waypoints } from 'lucide-react'
import type { Tunnel } from '../types'
import { Section } from './ui/Section'
import { formatNumber } from '../lib/format'

interface TunnelsTableProps {
  data: Tunnel[] | null
  loading: boolean
  error: Error | null
  onRetry?: () => void
}

export function TunnelsTable({ data, loading, error, onRetry }: TunnelsTableProps) {
  const tunnels = data ?? []
  const maxAttempts = tunnels.reduce((m, t) => Math.max(m, t.attempts), 0)

  return (
    <Section
      title="SSH tunneling attempts"
      description="Forwarding targets requested through the honeypot"
      icon={<Waypoints className="h-4 w-4" />}
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeletonRows={5}
    >
      {tunnels.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-slate-500">
          No tunneling attempts recorded.
        </div>
      ) : (
        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-2 font-medium">Target</th>
                <th className="pb-2 text-right font-medium">Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tunnels.map((t, i) => (
                <tr key={`${t.target}-${i}`} className="group">
                  <td className="py-2.5 pr-3">
                    <div className="font-mono text-slate-200">{t.target}</div>
                    {/* Mini usage bar relative to the busiest target */}
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-indigo-500/70"
                        style={{
                          width: `${maxAttempts ? (t.attempts / maxAttempts) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </td>
                  <td className="py-2.5 text-right align-top font-semibold tabular-nums text-slate-200">
                    {formatNumber(t.attempts)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}
