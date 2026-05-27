"""
Cowrie Honeypot ETL parser.

Reads JSON logs from Cowrie, enriches IPs with GeoIP data,
and writes structured events to PostgreSQL.

Modes:
  --backfill   Read entire log file once and exit (for initial load)
  --tail       Follow log file for new entries (continuous mode)
"""

import argparse
import json
import logging
import os
import signal
import sys
import time
from pathlib import Path

import geoip2.database
import geoip2.errors
import psycopg
from dotenv import load_dotenv

# ============================================================
# Setup
# ============================================================

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("parser")

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "dbname": os.getenv("DB_NAME", "honeypot"),
    "user": os.getenv("DB_USER", "honeypot"),
    "password": os.getenv("DB_PASSWORD", ""),
}

COWRIE_LOG = Path(os.getenv("COWRIE_LOG", "/path/to/cowrie/var/log/cowrie/cowrie.json"))
GEOIP_DB = Path(os.getenv("GEOIP_DB", "/path/to/parser/GeoLite2-City.mmdb"))

# Counters for stats
stats = {
    "lines_read": 0,
    "events_parsed": 0,
    "sessions_inserted": 0,
    "logins_inserted": 0,
    "commands_inserted": 0,
    "downloads_inserted": 0,
    "geoip_resolved": 0,
    "errors": 0,
}

# Graceful shutdown flag
should_exit = False


def handle_signal(signum, frame):
    """Allow Ctrl+C / SIGTERM to exit cleanly."""
    global should_exit
    log.info("Shutdown signal received, finishing current event...")
    should_exit = True


signal.signal(signal.SIGINT, handle_signal)
signal.signal(signal.SIGTERM, handle_signal)


# ============================================================
# GeoIP enrichment
# ============================================================

class GeoIPResolver:
    """Resolves IP -> country/city/coords. Caches results in DB."""

    def __init__(self, mmdb_path: Path, conn):
        self.reader = geoip2.database.Reader(str(mmdb_path))
        self.conn = conn
        self._cache: set[str] = set()  # IPs already in DB this run

    def enrich(self, ip: str) -> None:
        """Resolve IP and insert into ip_geo if not already there."""
        if ip in self._cache:
            return

        with self.conn.cursor() as cur:
            cur.execute("SELECT 1 FROM ip_geo WHERE ip = %s", (ip,))
            if cur.fetchone():
                self._cache.add(ip)
                return

        try:
            r = self.reader.city(ip)
            country = r.country.name
            country_code = r.country.iso_code
            city = r.city.name
            lat = r.location.latitude
            lon = r.location.longitude
            org = getattr(r.traits, "autonomous_system_organization", None) or None
        except geoip2.errors.AddressNotFoundError:
            country = country_code = city = org = None
            lat = lon = None
        except Exception as e:
            log.warning(f"GeoIP error for {ip}: {e}")
            country = country_code = city = org = None
            lat = lon = None

        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO ip_geo (ip, country, country_code, city, latitude, longitude, organization)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (ip) DO NOTHING
                """,
                (ip, country, country_code, city, lat, lon, org),
            )

        self._cache.add(ip)
        stats["geoip_resolved"] += 1

    def close(self):
        self.reader.close()


# ============================================================
# Event handlers
# ============================================================

class EventHandler:
    """Dispatches Cowrie events to the right SQL inserts."""

    def __init__(self, conn, geoip: GeoIPResolver):
        self.conn = conn
        self.geoip = geoip

    def handle(self, event: dict) -> None:
        eventid = event.get("eventid", "")

        try:
            if eventid == "cowrie.session.connect":
                self._on_session_connect(event)
            elif eventid == "cowrie.client.version":
                self._on_client_version(event)
            elif eventid == "cowrie.client.kex":
                self._on_client_kex(event)
            elif eventid == "cowrie.session.closed":
                self._on_session_closed(event)
            elif eventid == "cowrie.log.closed":
                self._on_log_closed(event)
            elif eventid in ("cowrie.login.success", "cowrie.login.failed"):
                self._on_login(event)
            elif eventid == "cowrie.command.input":
                self._on_command(event)
            elif eventid in ("cowrie.session.file_download", "cowrie.session.file_upload"):
                self._on_download(event)
            elif eventid == "cowrie.direct-tcpip.request":
                self._on_tunnel_request(event)
            # other events are ignored silently
        except psycopg.Error as e:
            stats["errors"] += 1
            log.error(f"DB error on event {eventid}: {e}")
            self.conn.rollback()
        except Exception as e:
            stats["errors"] += 1
            log.error(f"Parser error on event {eventid}: {e}")

    def _ensure_session(self, session_id: str, src_ip: str, src_port: int, started_at: str) -> None:
        """Insert a minimal session row if it doesn't exist yet."""
        self.geoip.enrich(src_ip)
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO sessions (session_id, src_ip, src_port, started_at)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (session_id) DO NOTHING
                """,
                (session_id, src_ip, src_port, started_at),
            )
            if cur.rowcount > 0:
                stats["sessions_inserted"] += 1

    def _on_session_connect(self, e: dict) -> None:
        self._ensure_session(
            session_id=e["session"],
            src_ip=e["src_ip"],
            src_port=e.get("src_port"),
            started_at=e["timestamp"],
        )

    def _on_client_version(self, e: dict) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE sessions SET ssh_client_version = %s WHERE session_id = %s",
                (e.get("version"), e["session"]),
            )

    def _on_client_kex(self, e: dict) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE sessions SET hassh = %s WHERE session_id = %s",
                (e.get("hassh"), e["session"]),
            )

    def _on_session_closed(self, e: dict) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE sessions
                   SET ended_at = %s,
                       duration_seconds = %s
                 WHERE session_id = %s
                """,
                (e["timestamp"], float(e.get("duration", 0)), e["session"]),
            )

    def _on_log_closed(self, e: dict) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE sessions SET tty_log_path = %s WHERE session_id = %s",
                (e.get("ttylog"), e["session"]),
            )

    def _on_login(self, e: dict) -> None:
        # Sometimes login events arrive before connect; ensure session row exists
        if "session" in e and "src_ip" in e:
            self._ensure_session(e["session"], e["src_ip"], None, e["timestamp"])

        success = e["eventid"] == "cowrie.login.success"
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO logins (session_id, username, password, success, timestamp)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (e["session"], e.get("username"), e.get("password"), success, e["timestamp"]),
            )
        stats["logins_inserted"] += 1

    def _on_command(self, e: dict) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO commands (session_id, command, timestamp)
                VALUES (%s, %s, %s)
                """,
                (e["session"], e.get("input", ""), e["timestamp"]),
            )
        stats["commands_inserted"] += 1

    def _on_download(self, e: dict) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO downloads (session_id, url, filename, sha256, timestamp)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    e["session"],
                    e.get("url"),
                    e.get("outfile") or e.get("destfile"),
                    e.get("shasum"),
                    e["timestamp"],
                ),
            )
        stats["downloads_inserted"] += 1

    def _on_tunnel_request(self, e: dict) -> None:
        """Track SSH tunneling attempts (attacker using us as proxy)."""
        target = f"{e.get('dst_ip', '?')}:{e.get('dst_port', '?')}"
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO commands (session_id, command, timestamp)
                VALUES (%s, %s, %s)
                """,
                (e["session"], f"[TUNNEL] {target}", e["timestamp"]),
            )
        stats["commands_inserted"] += 1


# ============================================================
# Backfill mode
# ============================================================

def run_backfill(handler: EventHandler, conn) -> None:
    if not COWRIE_LOG.exists():
        log.error(f"Log file not found: {COWRIE_LOG}")
        sys.exit(1)

    log.info(f"Backfilling from {COWRIE_LOG}")
    with COWRIE_LOG.open("r", encoding="utf-8", errors="replace") as f:
        for line in f:
            if should_exit:
                break
            stats["lines_read"] += 1
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
                stats["events_parsed"] += 1
                handler.handle(event)
            except json.JSONDecodeError:
                stats["errors"] += 1
                continue

            # Commit every 100 events to avoid huge transactions
            if stats["events_parsed"] % 100 == 0:
                conn.commit()
                log.info(f"Progress: {stats['events_parsed']} events parsed")

    conn.commit()
    log.info("Backfill complete.")
    log.info(f"Stats: {stats}")


# ============================================================
# Tail mode (real-time)
# ============================================================

def run_tail(handler: EventHandler, conn) -> None:
    if not COWRIE_LOG.exists():
        log.error(f"Log file not found: {COWRIE_LOG}")
        sys.exit(1)

    log.info(f"Tailing {COWRIE_LOG}")
    with COWRIE_LOG.open("r", encoding="utf-8", errors="replace") as f:
        f.seek(0, 2)  # seek to end
        while not should_exit:
            line = f.readline()
            if not line:
                conn.commit()  # flush any pending writes
                time.sleep(0.5)
                continue
            stats["lines_read"] += 1
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
                stats["events_parsed"] += 1
                handler.handle(event)
                conn.commit()  # commit per event in tail mode
            except json.JSONDecodeError:
                stats["errors"] += 1
                continue

    log.info("Tail mode stopped.")
    log.info(f"Stats: {stats}")


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Cowrie ETL parser")
    parser.add_argument("--backfill", action="store_true", help="Backfill from existing log")
    parser.add_argument("--tail", action="store_true", help="Tail log in real time")
    args = parser.parse_args()

    if not args.backfill and not args.tail:
        parser.error("Choose --backfill or --tail")

    log.info("Connecting to PostgreSQL...")
    conn = psycopg.connect(**DB_CONFIG)
    log.info("Connected.")

    log.info("Loading GeoIP database...")
    geoip = GeoIPResolver(GEOIP_DB, conn)
    log.info("GeoIP loaded.")

    handler = EventHandler(conn, geoip)

    try:
        if args.backfill:
            run_backfill(handler, conn)
        elif args.tail:
            run_tail(handler, conn)
    finally:
        geoip.close()
        conn.close()
        log.info("Cleanup done.")


if __name__ == "__main__":
    main()
