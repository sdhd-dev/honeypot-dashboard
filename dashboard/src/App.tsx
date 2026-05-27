import { useApiData } from './hooks/useApiData'
import type {
  Download,
  GeoMarker,
  RecentEvent,
  StatsSummary,
  TimelinePoint,
  TopCountry,
  TopPassword,
  TopUsername,
  Tunnel,
} from './types'
import { KeyRound, User } from 'lucide-react'

import { Header } from './components/Header'
import { KpiCards } from './components/KpiCards'
import { WorldMap } from './components/WorldMap'
import { CredentialChart } from './components/CredentialChart'
import { TimelineChart } from './components/TimelineChart'
import { CountriesChart } from './components/CountriesChart'
import { TunnelsTable } from './components/TunnelsTable'
import { RecentAttacksTable } from './components/RecentAttacksTable'
import { MalwareTable } from './components/MalwareTable'
import { Footer } from './components/Footer'
import { ErrorBanner } from './components/ui/ErrorBanner'

// Poll every 30s. The hook keeps showing the last good data during refreshes.
const REFRESH = 30_000

export default function App() {
  // Summary drives the header, KPI cards, and the global connectivity banner.
  const summary = useApiData<StatsSummary>('/api/stats/summary', REFRESH)
  const passwords = useApiData<TopPassword[]>('/api/stats/top-passwords?limit=10', REFRESH)
  const usernames = useApiData<TopUsername[]>('/api/stats/top-usernames?limit=10', REFRESH)
  const countries = useApiData<TopCountry[]>('/api/stats/top-countries?limit=10', REFRESH)
  const timeline = useApiData<TimelinePoint[]>('/api/stats/timeline?hours=24', REFRESH)
  const events = useApiData<RecentEvent[]>('/api/events/recent?limit=50', REFRESH)
  const markers = useApiData<GeoMarker[]>('/api/geo/markers', REFRESH)
  const downloads = useApiData<Download[]>('/api/downloads', REFRESH)
  const tunnels = useApiData<Tunnel[]>('/api/tunnels', REFRESH)

  return (
    <div className="min-h-screen bg-slate-950">
      <Header
        lastAttack={summary.data?.last_attack}
        loading={summary.loading}
        refreshing={summary.refreshing}
      />

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        {/* Global banner only when summary itself can't be reached (we still
            keep rendering the last known data underneath). */}
        {summary.error && (
          <ErrorBanner error={summary.error} onRetry={summary.refetch} />
        )}

        {/* 2. KPI cards */}
        <KpiCards summary={summary.data} loading={summary.loading} />

        {/* 3. World map */}
        <WorldMap
          markers={markers.data}
          loading={markers.loading}
          error={markers.error}
          onRetry={markers.refetch}
        />

        {/* 4. Credentials: top passwords + usernames */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <CredentialChart
            title="Top passwords"
            description="Most-tried passwords across login attempts"
            icon={<KeyRound className="h-4 w-4" />}
            data={passwords.data}
            loading={passwords.loading}
            error={passwords.error}
            onRetry={passwords.refetch}
            labelKey="password"
            valueKey="attempts"
          />
          <CredentialChart
            title="Top usernames"
            description="Most-tried usernames across login attempts"
            icon={<User className="h-4 w-4" />}
            data={usernames.data}
            loading={usernames.loading}
            error={usernames.error}
            onRetry={usernames.refetch}
            labelKey="username"
            valueKey="attempts"
          />
        </div>

        {/* 5. Timeline */}
        <TimelineChart
          data={timeline.data}
          loading={timeline.loading}
          error={timeline.error}
          onRetry={timeline.refetch}
        />

        {/* 6. Countries + tunnels */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <CountriesChart
            data={countries.data}
            loading={countries.loading}
            error={countries.error}
            onRetry={countries.refetch}
          />
          <TunnelsTable
            data={tunnels.data}
            loading={tunnels.loading}
            error={tunnels.error}
            onRetry={tunnels.refetch}
          />
        </div>

        {/* 7. Recent attacks */}
        <RecentAttacksTable
          data={events.data}
          loading={events.loading}
          error={events.error}
          onRetry={events.refetch}
          limit={20}
        />

        {/* 8. Captured malware */}
        <MalwareTable
          data={downloads.data}
          loading={downloads.loading}
          error={downloads.error}
          onRetry={downloads.refetch}
        />
      </main>

      <Footer />
    </div>
  )
}
