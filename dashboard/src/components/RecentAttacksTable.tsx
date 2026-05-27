import { ListOrdered } from 'lucide-react'
import type { RecentEvent } from '../types'
import { Section } from './ui/Section'
import { cleanIp, countryCodeToFlag, relativeTime } from '../lib/format'

interface RecentAttacksTableProps {
  data: RecentEvent[] | null
  loading: boolean
  error: Error | null
  onRetry?: () => void
  /** How many rows to display (defaults to 20). */
  limit?: number
}

export function RecentAttacksTable({
  data,
  loading,
  error,
  onRetry,
  limit = 20,
}: RecentAttacksTableProps) {
  const events = (data ?? []).slice(0, limit)

  return (
    <Section
      title="Recent attacks"
      description={`Latest ${limit} honeypot sessions`}
      icon={<ListOrdered className="h-4 w-4" />}
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeletonRows={8}
    >
      {events.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-slate-500">
          No sessions recorded yet.
        </div>
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-2 pb-2 font-medium">Time</th>
                <th className="px-2 pb-2 font-medium">Source IP</th>
                <th className="px-2 pb-2 font-medium">Country</th>
                <th className="px-2 pb-2 font-medium">City</th>
                <th className="px-2 pb-2 font-medium">SSH client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {events.map((e) => (
                <tr
                  key={e.session_id}
                  className="transition-colors hover:bg-slate-800/40"
                >
                  <td className="whitespace-nowrap px-2 py-2.5 text-slate-400">
                    {relativeTime(e.started_at)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 font-mono text-slate-200">
                    {cleanIp(e.src_ip)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-slate-300">
                    <span className="mr-1.5">{countryCodeToFlag(e.country_code)}</span>
                    {e.country ?? 'Unknown'}
                  </td>
                  <td className="max-w-[160px] truncate px-2 py-2.5 text-slate-400">
                    {e.city ?? '—'}
                  </td>
                  <td className="max-w-[180px] truncate px-2 py-2.5 font-mono text-xs text-slate-400">
                    <span title={e.ssh_client_version ?? undefined}>
                      {e.ssh_client_version ?? '—'}
                    </span>
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
