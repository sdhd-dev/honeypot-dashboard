import { useCallback, useEffect, useRef, useState } from 'react'

export interface ApiState<T> {
  data: T | null
  /** True only on the very first load (no data yet). Background refreshes
   *  don't flip this, so the UI doesn't flash skeletons every 30s. */
  loading: boolean
  /** True while a background refresh is in flight (data already present). */
  refreshing: boolean
  error: Error | null
  /** Manually trigger a refetch. */
  refetch: () => void
}

/**
 * Fetch JSON from an API endpoint and keep it fresh on an interval.
 *
 * @param endpoint  Path beginning with "/api/..." (proxied in dev, same-origin in prod).
 * @param refreshIntervalMs  Poll interval in ms. Pass 0 to disable auto-refresh.
 */
export function useApiData<T>(
  endpoint: string,
  refreshIntervalMs = 30_000,
): ApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Track mount status so we never set state after unmount.
  const mountedRef = useRef(true)
  // Keep latest `data` accessible inside the stable fetch callback.
  const hasDataRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (hasDataRef.current) {
      setRefreshing(true)
    }
    try {
      const res = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`)
      }
      const json = (await res.json()) as T
      if (!mountedRef.current) return
      setData(json)
      hasDataRef.current = true
      setError(null)
    } catch (err) {
      if (!mountedRef.current) return
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [endpoint])

  useEffect(() => {
    mountedRef.current = true
    hasDataRef.current = false
    setLoading(true)
    fetchData()

    if (refreshIntervalMs > 0) {
      const id = setInterval(fetchData, refreshIntervalMs)
      return () => {
        mountedRef.current = false
        clearInterval(id)
      }
    }
    return () => {
      mountedRef.current = false
    }
  }, [fetchData, refreshIntervalMs])

  return { data, loading, refreshing, error, refetch: fetchData }
}
