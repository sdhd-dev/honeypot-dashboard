import { AlertTriangle, RefreshCw } from 'lucide-react'

/** Full-width banner shown at the top of the page when the API is unreachable. */
export function ErrorBanner({
  error,
  onRetry,
}: {
  error: Error
  onRetry?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
        <span>
          Couldn't reach the honeypot API.{' '}
          <span className="text-red-300/70">({error.message})</span> Showing the
          last known data; retrying automatically.
        </span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-red-500/40 px-2.5 py-1 text-xs font-medium text-red-200 transition hover:bg-red-500/20"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      )}
    </div>
  )
}

/** Inline error state used inside a section card when its data fails to load. */
export function ErrorState({
  error,
  onRetry,
}: {
  error: Error
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <AlertTriangle className="h-6 w-6 text-red-400" />
      <p className="text-sm text-slate-400">
        Failed to load this section.
        <br />
        <span className="text-xs text-slate-500">{error.message}</span>
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      )}
    </div>
  )
}
