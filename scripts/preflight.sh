#!/usr/bin/env bash
#
# Read-only survey of the instance, to be run on the box before deploying:
#
#   bash preflight.sh
#
# It changes nothing. It prints the handful of facts that decide whether this
# instance can build and serve the app, so they can be pasted into a message
# instead of screenshotted.
set -uo pipefail

line() { printf '%-26s %s\n' "$1" "$2"; }
hr() { printf '\n%s\n' "── $1 ──────────────────────────────"; }

hr "Instance"
line "hostname" "$(hostname)"
line "os" "$(. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME" || uname -sr)"
line "kernel / arch" "$(uname -r) / $(uname -m)"
line "login user" "$(id -un)"

# The metadata service answers only from the instance itself. IMDSv2 first.
TOKEN="$(curl -s -X PUT -m 2 'http://169.254.169.254/latest/api/token' \
  -H 'X-aws-ec2-metadata-token-ttl-seconds: 60' 2>/dev/null || true)"
meta() {
  if [ -n "$TOKEN" ]; then
    curl -s -m 2 -H "X-aws-ec2-metadata-token: $TOKEN" "http://169.254.169.254/latest/meta-data/$1" 2>/dev/null
  else
    curl -s -m 2 "http://169.254.169.254/latest/meta-data/$1" 2>/dev/null
  fi
}
hr "EC2"
line "instance type" "$(meta instance-type || echo '?')"
line "instance id" "$(meta instance-id || echo '?')"
line "availability zone" "$(meta placement/availability-zone || echo '?')"
line "public ipv4" "$(meta public-ipv4 || echo 'none — no public IP or EIP attached')"
line "public dns" "$(meta public-hostname || echo '?')"
line "ami" "$(meta ami-id || echo '?')"

hr "Capacity"
line "cpus" "$(nproc)"
line "memory" "$(free -h | awk '/^Mem:/{print $2" total, "$7" available"}')"
line "swap" "$(free -h | awk '/^Swap:/{print $2}')"
line "disk /" "$(df -h / | awk 'NR==2{print $2" total, "$4" free"}')"
if [ "$(free -m | awk '/^Mem:/{print $2}')" -lt 3500 ]; then
  echo "  ! under ~4 GB: 'next build' may be killed. Add swap, or build elsewhere."
fi

hr "Software"
for c in node pnpm git nginx psql certbot; do
  if command -v "$c" >/dev/null 2>&1; then
    line "$c" "$("$c" --version 2>&1 | head -1)"
  else
    line "$c" "not installed"
  fi
done

hr "Network"
line "outbound https" "$(curl -s -o /dev/null -m 5 -w '%{http_code}' https://registry.npmjs.org/ || echo 'failed')"
for p in 80 443 3000; do
  line "listening on :$p" "$( (ss -lntp 2>/dev/null || netstat -lntp 2>/dev/null) | grep -q ":$p " && echo yes || echo no)"
done
line "yatra service" "$(systemctl is-active yatra 2>/dev/null || echo 'not installed')"

hr "Database reachability"
if [ -f /srv/yatra/.env.production ] && grep -q '^DATABASE_URL=.\+' /srv/yatra/.env.production; then
  # shellcheck disable=SC1091
  DB_HOST="$(grep '^DATABASE_URL=' /srv/yatra/.env.production | sed -E 's|.*@([^:/]+).*|\1|')"
  line "db host" "$DB_HOST"
  if command -v nc >/dev/null 2>&1; then
    line "tcp 5432" "$(nc -z -w 4 "$DB_HOST" 5432 && echo reachable || echo 'NOT reachable — check the RDS security group')"
  else
    line "tcp 5432" "install netcat to test: sudo apt install -y netcat-openbsd"
  fi
else
  line "DATABASE_URL" "not set yet"
fi

hr "DNS"
DOMAIN="${DOMAIN:-ekatmayatra.xoidlabs.com}"
line "$DOMAIN" "$(getent hosts "$DOMAIN" | awk '{print $1}' | paste -sd, - || echo 'does not resolve yet')"

printf '\n'
