# 🍯 Honeypot Dashboard

A production-grade React dashboard visualizing **real attack data** from a
[Cowrie](https://github.com/cowrie/cowrie) SSH honeypot deployed on a Hetzner VPS.

Built with **Vite + React 18 + TypeScript + Tailwind CSS**, charts via
**Recharts**, and a world map via **react-leaflet / Leaflet**. Modern dark theme,
mobile-responsive, and auto-refreshing every 30 seconds.

![stack](https://img.shields.io/badge/stack-React%20·%20Vite%20·%20Tailwind%20·%20Recharts%20·%20Leaflet-3b82f6)

---

## Features

- **KPI cards** — total sessions, unique IPs, countries, login attempts, malware files
- **World map** — geolocated source IPs as circle markers (size ∝ attack count, sqrt scale; top attackers in red)
- **Credential charts** — top passwords & usernames, with crypto-related entries highlighted in amber
- **Attack timeline** — sessions per hour over the last 24h (gradient area chart)
- **Top countries** + **SSH tunneling targets**
- **Recent attacks table** — relative timestamps, country flags, SSH client strings
- **Captured malware** — SHA-256 hashes with click-to-copy
- Loading skeletons, inline error states, and a global "API unreachable" banner
- Auto-refresh every 30s without flashing skeletons (last-known data stays visible)

---

## Local development

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

During dev, Vite proxies `/api/*` to the live backend
(`<YOUR_SERVER_IP_OR_DOMAIN>`), configured in `vite.config.ts` — so the dashboard
shows real data with no CORS setup.

---

## Production build

```bash
npm run build
```

This type-checks and outputs static files to `dist/`. Assets use **relative
paths** (`base: './'` in `vite.config.ts`), so the bundle works when served from
a subpath like `/var/www/honeypot/`.

Preview the production build locally:

```bash
npm run preview
```

> Note: `npm run preview` serves the static bundle but does **not** proxy
> `/api`. In production the dashboard and the API are served from the **same
> origin** (nginx reverse-proxies `/api` to FastAPI), so relative `/api/...`
> requests resolve correctly once deployed.

---

## Deploy

Copy the built files to the server's web root over SSH (port `64222`):

```bash
npm run build
scp -P 64222 -r dist/* <USER>@<YOUR_SERVER>:/var/www/honeypot/
```

nginx serves `/var/www/honeypot/` as static files and reverse-proxies `/api/*`
to the FastAPI backend, so no further configuration is needed on the frontend.

---

## Project structure

```
src/
├── App.tsx                  # Data container: one useApiData() call per endpoint + layout
├── types.ts                 # TypeScript interfaces for every API response
├── hooks/
│   └── useApiData.ts        # Fetch + 30s auto-refresh hook (loading/refreshing/error/refetch)
├── lib/
│   └── format.ts            # Number formatting, flag emojis, relative time, crypto detection
└── components/
    ├── Header.tsx           # Sticky header + "last attack" live indicator
    ├── KpiCards.tsx         # 5 KPI cards
    ├── WorldMap.tsx         # Leaflet map (CartoDB Dark Matter tiles)
    ├── CredentialChart.tsx  # Reusable horizontal bar chart (passwords / usernames)
    ├── TimelineChart.tsx    # Area chart, attacks per hour
    ├── CountriesChart.tsx   # Top countries bar chart
    ├── TunnelsTable.tsx     # SSH tunneling targets
    ├── RecentAttacksTable.tsx
    ├── MalwareTable.tsx     # Captured downloads with click-to-copy SHA-256
    ├── Footer.tsx
    └── ui/                  # Section card, skeletons, error states
```

## Backend

Cowrie · PostgreSQL · Python ETL · GeoIP · FastAPI · nginx.
The dashboard is read-only and consumes the JSON API documented in `src/types.ts`.
