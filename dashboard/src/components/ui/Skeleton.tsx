interface SkeletonProps {
  className?: string
}

/** A single shimmering placeholder block. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-slate-800/80 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />
    </div>
  )
}

/** A column of stacked skeleton lines, handy for tables/lists. */
export function SkeletonRows({
  rows = 5,
  className = '',
}: {
  rows?: number
  className?: string
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  )
}
