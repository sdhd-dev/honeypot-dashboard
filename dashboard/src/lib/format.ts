import { formatDistanceToNowStrict, format, parseISO } from 'date-fns'

/** Format an integer with locale thousand separators, e.g. 1234 -> "1,234". */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toLocaleString('en-US')
}

/**
 * Convert an ISO-3166 alpha-2 country code into its flag emoji by mapping each
 * letter to its Regional Indicator Symbol. Returns a globe for unknown codes.
 */
export function countryCodeToFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2 || !/^[a-zA-Z]{2}$/.test(code)) return '🌐'
  const upper = code.toUpperCase()
  const A = 0x1f1e6 // Regional Indicator Symbol Letter A
  const base = 'A'.charCodeAt(0)
  return String.fromCodePoint(
    A + (upper.charCodeAt(0) - base),
    A + (upper.charCodeAt(1) - base),
  )
}

/** Strip a CIDR suffix (e.g. "1.2.3.4/32" -> "1.2.3.4"). */
export function cleanIp(ip: string | null | undefined): string {
  if (!ip) return '—'
  return ip.split('/')[0]
}

/** Parse an ISO timestamp into a relative string, e.g. "2 min ago". Defensive
 *  against malformed/empty input. */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true })
  } catch {
    return '—'
  }
}

/** Absolute, compact timestamp for tables, e.g. "May 26, 09:29". */
export function absoluteTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'MMM d, HH:mm')
  } catch {
    return '—'
  }
}

/** Last path segment of a file path. */
export function basename(path: string | null | undefined): string {
  if (!path) return '—'
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 1] || path
}

/**
 * Heuristic: does this credential / string look crypto- or wallet-related?
 * Used to highlight attacker interest in crypto infrastructure.
 */
const CRYPTO_KEYWORDS = [
  'sol',
  'solana',
  'eth',
  'ethereum',
  'btc',
  'bitcoin',
  'wallet',
  'validator',
  'crypto',
  'miner',
  'mining',
  'xmr',
  'monero',
  'node',
  'rpc',
  'web3',
  'defi',
  'staking',
  'ledger',
  'metamask',
]

export function isCrypto(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.toLowerCase()
  return CRYPTO_KEYWORDS.some((kw) => v === kw || v.includes(kw))
}
