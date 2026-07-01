#!/usr/bin/env bash
#
# keepalive-supabase.sh
# ---------------------------------------------------------------------------
# Keeps the nis-prod Supabase project awake so it never auto-pauses.
#
# WHY: the Supabase free tier pauses a project after ~7 days with no activity.
# While paused the live shop still renders (the catalog is hardcoded) but every
# DB touch silently fails — checkout, waitlist and downloads break with no error
# a visitor can see. A tiny daily read against commerce.products counts as
# activity and keeps the project from ever reaching the paused state.
#
# DEPLOYMENT (lives on the VPS, NOT baked into the app image):
#   scp apps/web/scripts/keepalive-supabase.sh root@<vps>:/docker/keepalive/keepalive-supabase.sh
#   ssh root@<vps> 'chmod +x /docker/keepalive/keepalive-supabase.sh'
#   crontab (root, box is UTC):
#     0 6,18 * * * /docker/keepalive/keepalive-supabase.sh >> /docker/keepalive/keepalive.log 2>&1
#
# The Supabase URL + service-role key are read from the live deploy env
# (/docker/nis-web/.env) at run time. They are NEVER hardcoded here or committed
# to the repo — the secret never leaves the box.
# ---------------------------------------------------------------------------
set -euo pipefail

ENV_FILE="${NIS_ENV_FILE:-/docker/nis-web/.env}"

read_env() { grep -E "^$1=" "$ENV_FILE" | head -n1 | cut -d= -f2-; }

URL="$(read_env NEXT_PUBLIC_SUPABASE_URL)"
KEY="$(read_env SUPABASE_SERVICE_ROLE_KEY)"

TS="$(date -u +%FT%TZ)"

if [ -z "$URL" ] || [ -z "$KEY" ]; then
  echo "$TS  ERROR  missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in $ENV_FILE"
  exit 1
fi

# A real SELECT against commerce.products (service role bypasses RLS, so it is
# schema/policy independent and always executes a query when the project is up).
CODE="$(curl -s -o /dev/null -w '%{http_code}' \
  --max-time 30 \
  "$URL/rest/v1/products?select=id&limit=1" \
  -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY" \
  -H "Accept-Profile: commerce")"

echo "$TS  keepalive commerce.products -> HTTP $CODE"

case "$CODE" in
  2*) exit 0 ;;
  *)  exit 1 ;;   # non-2xx: surface via cron mail + it stands out in the log
esac
