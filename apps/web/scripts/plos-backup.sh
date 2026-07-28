#!/usr/bin/env bash
# Nightly logical backup of the PLOS Postgres DB (plos-db container).
# Keeps the most recent 14 daily dumps (gzip) ON the VPS, and copies each
# fresh dump OFF the box to Supabase Storage via plos-offbox.py.
#
# Canonical copy — deployed to the VPS at /docker/backups/plos-backup.sh.
# Cron (root, box is UTC; 22:30 UTC = 04:00 IST):
#   30 22 * * * /docker/backups/plos-backup.sh >> /docker/backups/plos/backup.log 2>&1
set -euo pipefail
BACKUP_DIR=/docker/backups/plos
mkdir -p "$BACKUP_DIR"
TS=$(date +%Y%m%d-%H%M%S)
FILE="$BACKUP_DIR/plos-$TS.sql.gz"
docker exec plos-db pg_dump -U plos -d plos | gzip > "$FILE"
# Retain the 14 newest LOCAL dumps; delete older ones.
ls -1t "$BACKUP_DIR"/plos-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
echo "$(date -u +%FT%TZ) backup OK: $FILE ($(du -h "$FILE" | cut -f1))"
# Off-box copy to Supabase Storage (best-effort — a failure here must NOT fail
# the local backup, which is authoritative). Runs on the fresh dump above.
/docker/backups/plos-offbox.py "$FILE" \
  || echo "$(date -u +%FT%TZ) offbox upload FAILED (local backup is fine)"
