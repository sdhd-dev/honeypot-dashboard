// API response shapes for the honeypot backend (FastAPI).
// Base path is `/api` (proxied in dev, same-origin in production).

export interface StatsSummary {
  total_sessions: number
  unique_ips: number
  total_logins: number
  successful_logins: number
  total_commands: number
  total_downloads: number
  countries: number
  /** ISO 8601 timestamp of the most recent attack, or null if none yet. */
  last_attack: string | null
}

export interface TopPassword {
  password: string
  attempts: number
}

export interface TopUsername {
  username: string
  attempts: number
}

export interface TopCountry {
  country: string
  country_code: string
  sessions: number
  unique_ips: number
}

export interface TimelinePoint {
  /** ISO 8601 timestamp marking the start of the hour bucket. */
  hour: string
  sessions: number
}

export interface RecentEvent {
  session_id: string
  /** May include a CIDR suffix such as "/32" — strip before display. */
  src_ip: string
  country: string | null
  country_code: string | null
  city: string | null
  started_at: string
  duration_seconds: number
  ssh_client_version: string | null
}

export interface GeoMarker {
  ip: string
  country: string | null
  country_code: string | null
  city: string | null
  latitude: number
  longitude: number
  attacks: number
}

export interface Download {
  timestamp: string
  src_ip: string
  country: string | null
  sha256: string
  filename: string
  url: string | null
}

export interface Tunnel {
  target: string
  attempts: number
}
