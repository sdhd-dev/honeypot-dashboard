import type { ReactNode } from 'react'
import { SkeletonRows } from './Skeleton'
import { ErrorState } from './ErrorBanner'

interface SectionProps {
  title: string
  /** Optional subtitle / context line under the title. */
  description?: string
  /** Optional element rendered on the right of the header (e.g. a badge). */
  action?: ReactNode
  icon?: ReactNode
  loading?: boolean
  error?: Error | null
  /** Number of skeleton rows to show while loading. */
  skeletonRows?: number
  onRetry?: () => void
  className?: string
  children: ReactNode
}

/**
 * Card wrapper used by every dashboard panel. Centralizes the loading-skeleton
 * and error-state handling so individual sections stay focused on their data.
 */
export function Section({
  title,
  description,
  action,
  icon,
  loading = false,
  error = null,
  skeletonRows = 5,
  onRetry,
  className = '',
  children,
}: SectionProps) {
  return (
    <section
      className={`rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20 ${className}`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {icon && <span className="mt-0.5 text-blue-400">{icon}</span>}
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-slate-100">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>

      {error && !loading ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : loading ? (
        <SkeletonRows rows={skeletonRows} />
      ) : (
        <div className="animate-fade-in">{children}</div>
      )}
    </section>
  )
}
