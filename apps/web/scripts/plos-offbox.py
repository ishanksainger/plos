#!/usr/bin/env python3
"""
PLOS DB backup — off-box copy to Supabase Storage.

The nightly `plos-backup.sh` writes gzipped pg_dump files to
`/docker/backups/plos/` on the VPS. Those protect against logical loss (a bad
migration, an accidental delete) but NOT against losing the VPS disk itself —
they sit on the same box as the database. This script copies each fresh dump
OFF the box into a private Supabase Storage bucket (`db-backups`, nis-prod,
Mumbai), a different provider + failure domain, and prunes old remote copies.

Best-effort by design: `plos-backup.sh` calls it AFTER the local dump + local
retention are already done, guarded with `|| echo …`, so an upload failure
never breaks the (authoritative) local backup.

Secrets are read at run time from the box's own env file and are NEVER
hardcoded here or committed (the secret never leaves the box):
  - Supabase URL + service-role key  <-  /docker/nis-web/.env

The `db-backups` bucket is PRIVATE (RLS, no policies) — only the service role
can read/write it; anon/authenticated are blocked. Same posture as `products`.

DEPLOYMENT (lives on the VPS, not baked into the app image):
  scp apps/web/scripts/plos-offbox.py root@<vps>:/docker/backups/plos-offbox.py
  ssh root@<vps> 'chmod +x /docker/backups/plos-offbox.py'
  plos-backup.sh calls it on the fresh dump (see that script). No new cron —
  it piggybacks the existing 22:30 UTC backup cron.

USAGE:
  plos-offbox.py <path-to-dump.sql.gz>   # upload that file, then prune remote
"""
import json
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

NIS_ENV = "/docker/nis-web/.env"
BUCKET = "db-backups"
PREFIX = "plos/"          # "folder" inside the bucket
KEEP = 30                 # newest N remote copies to retain (dumps are ~4 KB)


def read_env(path: str, key: str) -> str:
    try:
        with open(path) as f:
            for line in f:
                line = line.rstrip("\n")
                if line.startswith(key + "="):
                    return line[len(key) + 1 :]
    except FileNotFoundError:
        pass
    return ""


def log(msg: str) -> None:
    print(f"{datetime.now(timezone.utc).strftime('%FT%TZ')} offbox: {msg}")


def request(method: str, url: str, headers: dict, data: bytes | None = None) -> bytes:
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def main() -> int:
    if len(sys.argv) < 2:
        log("FAIL — no dump path given (usage: plos-offbox.py <file.sql.gz>)")
        return 2

    dump = Path(sys.argv[1])
    if not dump.is_file():
        log(f"FAIL — dump not found: {dump}")
        return 2

    base = read_env(NIS_ENV, "NEXT_PUBLIC_SUPABASE_URL").rstrip("/")
    key = read_env(NIS_ENV, "SUPABASE_SERVICE_ROLE_KEY")
    if not base or not key:
        log("FAIL — Supabase URL/service key not found in env")
        return 1

    storage = f"{base}/storage/v1"
    auth = {"Authorization": f"Bearer {key}", "apikey": key}
    name = dump.name
    object_path = f"{PREFIX}{name}"

    # 1) Upload the fresh dump (upsert so a same-day re-run overwrites cleanly).
    try:
        request(
            "POST",
            f"{storage}/object/{BUCKET}/{object_path}",
            {**auth, "Content-Type": "application/gzip", "x-upsert": "true"},
            data=dump.read_bytes(),
        )
        log(f"uploaded {object_path} ({dump.stat().st_size} bytes) -> {BUCKET}")
    except urllib.error.HTTPError as e:
        log(f"FAIL — upload HTTP {e.code}: {e.read().decode(errors='replace')[:200]}")
        return 1
    except Exception as e:  # noqa: BLE001 — best-effort; surface the reason, don't crash the cron
        log(f"FAIL — upload error: {e}")
        return 1

    # 2) Prune: keep the newest KEEP dumps, delete the rest. Names sort
    #    chronologically (plos-YYYYMMDD-HHMMSS.sql.gz), so ascending = oldest first.
    try:
        listing = request(
            "POST",
            f"{storage}/object/list/{BUCKET}",
            {**auth, "Content-Type": "application/json"},
            data=json.dumps(
                {"prefix": PREFIX, "limit": 1000, "sortBy": {"column": "name", "order": "asc"}}
            ).encode(),
        )
        items = json.loads(listing.decode())
        files = [
            it["name"] for it in items
            if it.get("id") and it.get("name", "").endswith(".sql.gz")
        ]
        stale = files[:-KEEP] if len(files) > KEEP else []
        if stale:
            paths = [f"{PREFIX}{n}" if not n.startswith(PREFIX) else n for n in stale]
            request(
                "DELETE",
                f"{storage}/object/{BUCKET}",
                {**auth, "Content-Type": "application/json"},
                data=json.dumps({"prefixes": paths}).encode(),
            )
            log(f"pruned {len(stale)} old remote dump(s); kept newest {KEEP}")
        else:
            log(f"remote holds {len(files)} dump(s); nothing to prune (keep {KEEP})")
    except Exception as e:  # noqa: BLE001 — prune is non-critical; the upload already succeeded
        log(f"WARN — prune skipped: {e}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
