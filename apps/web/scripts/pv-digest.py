#!/usr/bin/env python3
"""
NIS visitor digest — a short daily Telegram summary of real site visitors.

Reads marketing.page_views (nis-prod) via the Supabase REST API and Telegrams
Ishank a digest of the previous day's traffic. It is SILENT on zero-visitor
days — no demoralizing "0 visitors" pings; you only hear from it when someone
actually came.

Secrets are read at run time from the box's own env files and are NEVER
hardcoded here or committed to the repo (the secret never leaves the box):
  - Supabase URL + service-role key  <-  /docker/nis-web/.env
  - Telegram bot token               <-  /docker/openclaw-skqf/.env

DEPLOYMENT (lives on the VPS, not baked into the app image):
  scp apps/web/scripts/pv-digest.py root@<vps>:/docker/analytics/pv-digest.py
  ssh root@<vps> 'chmod +x /docker/analytics/pv-digest.py'
  crontab (root, box is UTC; 03:35 UTC = 09:05 IST):
    35 3 * * * /docker/analytics/pv-digest.py >> /docker/analytics/pv-digest.log 2>&1

USAGE:
  pv-digest.py            # yesterday (IST) — the cron default
  pv-digest.py today      # today so far (IST) — for a live test run
"""
import json
import sys
import urllib.request
import urllib.parse
from collections import Counter
from datetime import datetime, timedelta, timezone

NIS_ENV = "/docker/nis-web/.env"
OC_ENV = "/docker/openclaw-skqf/.env"
CHAT_ID = "1091696624"
IST = timezone(timedelta(hours=5, minutes=30))


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


def get_json(url: str, headers: dict):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def tg_send(token: str, text: str):
    data = urllib.parse.urlencode(
        {
            "chat_id": CHAT_ID,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": "true",
        }
    ).encode()
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage", data=data
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def main() -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    mode = sys.argv[1] if len(sys.argv) > 1 else "yesterday"

    url = read_env(NIS_ENV, "NEXT_PUBLIC_SUPABASE_URL")
    key = read_env(NIS_ENV, "SUPABASE_SERVICE_ROLE_KEY")
    token = read_env(OC_ENV, "TELEGRAM_BOT_TOKEN")
    if not (url and key and token):
        print(f"{ts}  ERROR  missing supabase url/key or telegram token")
        sys.exit(1)

    now_ist = datetime.now(IST)
    if mode == "today":
        start_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
        end_ist = now_ist
        label = "today so far"
    else:
        start_ist = (now_ist - timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end_ist = start_ist + timedelta(days=1)
        label = start_ist.strftime("%a %d %b")

    params = urllib.parse.urlencode(
        [
            ("select", "path,session_id,created_at"),
            ("created_at", f"gte.{start_ist.isoformat()}"),
            ("created_at", f"lt.{end_ist.isoformat()}"),
            ("limit", "100000"),
        ]
    )
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Accept-Profile": "marketing",
        "Accept": "application/json",
    }

    try:
        rows = get_json(f"{url}/rest/v1/page_views?{params}", headers)
    except Exception as e:  # noqa: BLE001 - log and exit non-zero for cron mail
        print(f"{ts}  ERROR  query failed: {e}")
        sys.exit(1)

    pageviews = len(rows)
    if pageviews == 0:
        print(f"{ts}  0 views ({label}) -> silent")
        return

    sessions = {r.get("session_id") for r in rows if r.get("session_id")}
    visits = len(sessions) if sessions else pageviews
    top = Counter(r["path"] for r in rows if r.get("path")).most_common(5)

    lines = [
        f"\U0001f440 <b>Visitors — {label}</b>",
        f"<b>{visits}</b> visit(s) · {pageviews} page view(s)",
        "",
        "Top pages:",
    ]
    lines += [f"  {path} — {n}" for path, n in top]
    text = "\n".join(lines)

    try:
        res = tg_send(token, text)
        print(f"{ts}  sent visits={visits} views={pageviews} ok={res.get('ok')}")
    except Exception as e:  # noqa: BLE001
        print(f"{ts}  ERROR  telegram send failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
