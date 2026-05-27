"""
Cowrie Honeypot Dashboard API.

Provides REST endpoints for the dashboard:
  GET /api/stats/summary        — overall counters
  GET /api/stats/top-passwords  — top 10 passwords
  GET /api/stats/top-usernames  — top 10 usernames
  GET /api/stats/top-countries  — top countries by attacks
  GET /api/stats/timeline       — attacks per hour (last 24h)
  GET /api/events/recent        — last 50 sessions with geo
  GET /api/geo/markers          — points for the world map
  GET /api/downloads            — captured malware list
  GET /api/tunnels              — SSH tunneling attempts
"""

import os
from contextlib import asynccontextmanager
from typing import Any

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "dbname": os.getenv("DB_NAME", "honeypot"),
    "user": os.getenv("DB_USER", "honeypot"),
    "password": os.getenv("DB_PASSWORD", ""),
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Open one connection pool-equivalent (simple single conn for our scale)
    app.state.conn = psycopg.connect(**DB_CONFIG, autocommit=True, row_factory=dict_row)
    yield
    app.state.conn.close()


app = FastAPI(
    title="Honeypot Dashboard API",
    description="REST API for the Cowrie SSH honeypot dashboard",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS: allow dashboard to call API from a different origin/port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],         # for production: lock to your dashboard URL
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def query(sql: str, params: tuple = ()) -> list[dict[str, Any]]:
    """Run a SELECT and return list of dicts."""
    with app.state.conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()


# ============================================================
# Endpoints
# ============================================================

@app.get("/")
def root():
    return {"status": "ok", "service": "honeypot-api", "version": "1.0.0"}


@app.get("/api/stats/summary")
def stats_summary():
    row = query("""
        SELECT
            (SELECT COUNT(*) FROM sessions) AS total_sessions,
            (SELECT COUNT(DISTINCT src_ip) FROM sessions) AS unique_ips,
            (SELECT COUNT(*) FROM logins) AS total_logins,
            (SELECT COUNT(*) FROM logins WHERE success = true) AS successful_logins,
            (SELECT COUNT(*) FROM commands) AS total_commands,
            (SELECT COUNT(*) FROM downloads) AS total_downloads,
            (SELECT COUNT(DISTINCT country) FROM ip_geo WHERE country IS NOT NULL) AS countries,
            (SELECT MAX(started_at) FROM sessions) AS last_attack
    """)[0]
    return row


@app.get("/api/stats/top-passwords")
def top_passwords(limit: int = 10):
    return query("""
        SELECT password, COUNT(*) AS attempts
        FROM logins
        WHERE password IS NOT NULL AND password != ''
        GROUP BY password
        ORDER BY attempts DESC
        LIMIT %s
    """, (limit,))


@app.get("/api/stats/top-usernames")
def top_usernames(limit: int = 10):
    return query("""
        SELECT username, COUNT(*) AS attempts
        FROM logins
        WHERE username IS NOT NULL AND username != ''
        GROUP BY username
        ORDER BY attempts DESC
        LIMIT %s
    """, (limit,))


@app.get("/api/stats/top-countries")
def top_countries(limit: int = 10):
    return query("""
        SELECT
            g.country,
            g.country_code,
            COUNT(DISTINCT s.session_id) AS sessions,
            COUNT(DISTINCT s.src_ip) AS unique_ips
        FROM sessions s
        JOIN ip_geo g ON s.src_ip = g.ip
        WHERE g.country IS NOT NULL
        GROUP BY g.country, g.country_code
        ORDER BY sessions DESC
        LIMIT %s
    """, (limit,))


@app.get("/api/stats/timeline")
def stats_timeline(hours: int = 24):
    return query("""
        SELECT
            date_trunc('hour', started_at) AS hour,
            COUNT(*) AS sessions
        FROM sessions
        WHERE started_at >= NOW() - (%s || ' hours')::interval
        GROUP BY hour
        ORDER BY hour ASC
    """, (str(hours),))


@app.get("/api/events/recent")
def events_recent(limit: int = 50):
    return query("""
        SELECT
            s.session_id,
            s.src_ip::text AS src_ip,
            g.country,
            g.country_code,
            g.city,
            s.started_at,
            s.duration_seconds,
            s.ssh_client_version
        FROM sessions s
        LEFT JOIN ip_geo g ON s.src_ip = g.ip
        ORDER BY s.started_at DESC
        LIMIT %s
    """, (limit,))


@app.get("/api/geo/markers")
def geo_markers():
    return query("""
        SELECT
            g.ip::text AS ip,
            g.country,
            g.country_code,
            g.city,
            g.latitude,
            g.longitude,
            COUNT(s.session_id) AS attacks
        FROM ip_geo g
        JOIN sessions s ON s.src_ip = g.ip
        WHERE g.latitude IS NOT NULL AND g.longitude IS NOT NULL
        GROUP BY g.ip, g.country, g.country_code, g.city, g.latitude, g.longitude
        ORDER BY attacks DESC
    """)


@app.get("/api/downloads")
def downloads():
    return query("""
        SELECT
            d.timestamp,
            s.src_ip::text AS src_ip,
            g.country,
            d.sha256,
            d.filename,
            d.url
        FROM downloads d
        JOIN sessions s ON d.session_id = s.session_id
        LEFT JOIN ip_geo g ON s.src_ip = g.ip
        ORDER BY d.timestamp DESC
    """)


@app.get("/api/tunnels")
def tunnels():
    return query("""
        SELECT
            REPLACE(command, '[TUNNEL] ', '') AS target,
            COUNT(*) AS attempts
        FROM commands
        WHERE command LIKE '[TUNNEL]%%'
        GROUP BY target
        ORDER BY attempts DESC
    """)
