import { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { GeoMarker } from '../types'
import { Section } from './ui/Section'
import { cleanIp, countryCodeToFlag, formatNumber } from '../lib/format'

interface WorldMapProps {
  markers: GeoMarker[] | null
  loading: boolean
  error: Error | null
  onRetry?: () => void
}

// Rank-based colors: top 3 attackers red, next 5 orange, the rest blue.
const COLORS = {
  high: '#ef4444', // red-500
  mid: '#f97316', // orange-500
  low: '#3b82f6', // blue-500
}

function colorForRank(rank: number): string {
  if (rank < 3) return COLORS.high
  if (rank < 8) return COLORS.mid
  return COLORS.low
}

/** Marker radius on an sqrt scale so area ~ attack count, with sane clamps. */
function radiusForAttacks(attacks: number): number {
  return Math.max(5, Math.min(28, Math.sqrt(attacks) * 3))
}

export function WorldMap({ markers, loading, error, onRetry }: WorldMapProps) {
  // Sort by attack count so rank-based coloring is stable.
  const ranked = useMemo(() => {
    if (!markers) return []
    return [...markers]
      .filter((m) => typeof m.latitude === 'number' && typeof m.longitude === 'number')
      .sort((a, b) => b.attacks - a.attacks)
  }, [markers])

  return (
    <Section
      title="Attack origins"
      description="Geolocated source IPs · marker size ∝ attacks · top attackers in red"
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeletonRows={1}
    >
      <div className="h-[500px] w-full overflow-hidden rounded-lg border border-slate-800">
        <MapContainer
          center={[25, 10]}
          zoom={2}
          minZoom={2}
          maxBounds={[
            [-85, -180],
            [85, 180],
          ]}
          scrollWheelZoom={false}
          worldCopyJump
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />
          {ranked.map((m, i) => {
            const color = colorForRank(i)
            return (
              <CircleMarker
                key={`${m.ip}-${i}`}
                center={[m.latitude, m.longitude]}
                radius={radiusForAttacks(m.attacks)}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.45,
                  weight: 1.5,
                }}
              >
                <Tooltip direction="top" opacity={1}>
                  <span className="font-medium">{cleanIp(m.ip)}</span> ·{' '}
                  {formatNumber(m.attacks)} attacks
                </Tooltip>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-mono text-sm font-semibold text-slate-100">
                      {cleanIp(m.ip)}
                    </div>
                    <div className="text-slate-300">
                      {countryCodeToFlag(m.country_code)}{' '}
                      {[m.city, m.country].filter(Boolean).join(', ') || 'Unknown'}
                    </div>
                    <div className="text-slate-400">
                      <span className="font-semibold text-slate-200">
                        {formatNumber(m.attacks)}
                      </span>{' '}
                      total attacks
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <LegendDot color={COLORS.high} label="Top 3 attackers" />
        <LegendDot color={COLORS.mid} label="Next 5" />
        <LegendDot color={COLORS.low} label="Others" />
        <span className="ml-auto text-slate-600">
          {formatNumber(ranked.length)} source IPs mapped
        </span>
      </div>
    </Section>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
