import { relativeTime } from '../lib/format'

interface HeaderProps {
  lastAttack: string | null | undefined
  /** True while data is loading for the first time. */
  loading: boolean
  /** True while a background refresh is in flight. */
  refreshing: boolean
}

export function Header({ lastAttack, loading, refreshing }: HeaderProps) {
  return (
    <header className="sticky top-0 z-[1000] border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-50 sm:text-xl">
            🍯 Honeypot Dashboard
          </h1>
          <p className="text-xs text-slate-400 sm:text-sm">
            Real attacks on a deployed SSH honeypot · Live data
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs sm:self-auto">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          <span className="text-slate-400">
            {loading ? (
              'Connecting…'
            ) : (
              <>
                Last attack:{' '}
                <span className="font-medium text-slate-200">
                  {relativeTime(lastAttack)}
                </span>
              </>
            )}
          </span>
          {refreshing && (
            <span className="ml-0.5 text-[10px] uppercase tracking-wider text-slate-600">
              syncing
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
