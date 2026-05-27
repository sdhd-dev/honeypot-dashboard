#!/bin/bash
# Простой бэкап honeypot-данных
# Создаёт ежедневный архив БД и логов в ~/backups/

set -euo pipefail

BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M)
RETAIN_DAYS=14

mkdir -p "$BACKUP_DIR"

# Дамп PostgreSQL (только если контейнер запущен)
if docker ps --format '{{.Names}}' | grep -q '^honeypot-db$'; then
    docker exec honeypot-db pg_dump -U honeypot -d honeypot \
        | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"
    echo "[OK] Database backup: db_$DATE.sql.gz"
else
    echo "[WARN] honeypot-db is not running, skipping DB backup"
fi

# Архив JSON-логов Cowrie
if [ -f "$HOME/honeypot/cowrie/var/log/cowrie/cowrie.json" ]; then
    tar czf "$BACKUP_DIR/logs_$DATE.tar.gz" \
        -C "$HOME/honeypot/cowrie/var/log/cowrie" . 2>/dev/null
    echo "[OK] Logs backup: logs_$DATE.tar.gz"
fi

# Удаляем старые бэкапы (>14 дней)
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +$RETAIN_DAYS -delete 2>/dev/null
find "$BACKUP_DIR" -name "logs_*.tar.gz" -mtime +$RETAIN_DAYS -delete 2>/dev/null

echo "[DONE] Backup completed at $(date)"
