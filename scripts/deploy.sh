#!/usr/bin/env bash
#
# Release Ekatma Yatra on the instance. Run it from the app directory:
#
#   bash scripts/deploy.sh
#
# Safe to run repeatedly. It stops before doing anything destructive if the
# environment is not set up, and it never seeds demo accounts into a real
# database (the seed itself refuses unless SEED_DEMO=1).
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

say() { printf '\n\033[1m→ %s\033[0m\n' "$*"; }
die() { printf '\n\033[31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

[ -f .env.production ] || die ".env.production is missing. Run scripts/provision-ec2.sh first."

set -a
# shellcheck disable=SC1091
. ./.env.production
set +a

[ -n "${DATABASE_URL:-}" ] || die "DATABASE_URL is empty in .env.production. The app will not start without it: the fallback writes to a directory this deploy would replace."
[ "${APP_ENV:-}" = "production" ] || die "APP_ENV is not \"production\" in .env.production. It is what turns on the checks that stop a misconfigured instance from serving."
case "${AUTH_SECRET:-}" in
  *dev-only-insecure*) die "AUTH_SECRET is still the example value from .env.example, which is public. Generate one: openssl rand -base64 32" ;;
  "") die "AUTH_SECRET is empty." ;;
esac

say "Fetching"
git pull --ff-only

say "Dependencies"
pnpm install --frozen-lockfile

say "Schema"
pnpm db:migrate

say "Reference data"
# States, districts, the route, the heritage sites, the automation registry and
# the predefined roles. Upserted, so this is safe on every release.
pnpm db:seed

say "Build"
pnpm build

say "Restarting"
sudo systemctl restart yatra
sleep 3
sudo systemctl --no-pager --lines=0 status yatra || true

say "Checking it answers"
for i in 1 2 3 4 5 6 7 8 9 10; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT:-3000}/" || true)"
  if [ "$code" = "200" ]; then
    printf '  landing page: %s\n' "$code"
    say "Deployed"
    exit 0
  fi
  sleep 2
done

die "The app is not answering on 127.0.0.1:${PORT:-3000}. Check: journalctl -u yatra -n 50"
