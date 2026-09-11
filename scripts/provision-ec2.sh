#!/usr/bin/env bash
#
# One-time setup for the EC2 instance that serves Ekatma Yatra.
#
# Run it on the instance, as the login user, from anywhere:
#
#   sudo -v                       # so the password prompt comes early
#   bash provision-ec2.sh
#
# Written for Amazon Linux 2023, which is what the instance is; the Ubuntu
# branches are kept because the first draft assumed Ubuntu and they cost
# nothing. Idempotent: safe to run again. It will not overwrite
# /srv/yatra/.env.production if that already exists.
set -euo pipefail

DOMAIN="${DOMAIN:-ekatmayatra.xoidlabs.com}"
APP_DIR="${APP_DIR:-/srv/yatra}"
APP_USER="${APP_USER:-$(id -un)}"
NODE_MAJOR=22
PNPM_VERSION=10.24.0

say() { printf '\n\033[1m→ %s\033[0m\n' "$*"; }
die() { printf '\n\033[31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

# shellcheck disable=SC1091
. /etc/os-release
case "${ID:-}" in
  amzn)   PKG=dnf ;;
  ubuntu) PKG=apt ;;
  *) die "Unrecognised OS '${ID:-?}'. This script knows Amazon Linux 2023 and Ubuntu." ;;
esac
say "Detected ${PRETTY_NAME}"

# ------------------------------------------------------------------ packages
say "System packages"
if [ "$PKG" = dnf ]; then
  sudo dnf install -y -q nginx git curl ca-certificates nmap-ncat dnf-automatic
  # Security patches on their own, the AL2023 way.
  sudo systemctl enable --now dnf-automatic.timer >/dev/null 2>&1 || true
else
  sudo apt-get update -qq
  sudo apt-get install -y -qq nginx git curl ca-certificates netcat-openbsd unattended-upgrades
fi

# ---------------------------------------------------------------------- node
say "Node ${NODE_MAJOR} and pnpm ${PNPM_VERSION}"
if ! node -v 2>/dev/null | grep -q "^v${NODE_MAJOR}\."; then
  if [ "$PKG" = dnf ]; then
    # AL2023 carries versioned Node packages; fall back to NodeSource if not.
    sudo dnf install -y -q "nodejs${NODE_MAJOR}" 2>/dev/null \
      || { curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | sudo bash - \
           && sudo dnf install -y -q nodejs; }
  else
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
    sudo apt-get install -y -qq nodejs
  fi
fi
# The dnf package does not ship corepack, so install pnpm through npm on both.
if ! pnpm -v 2>/dev/null | grep -q "^${PNPM_VERSION}$"; then
  sudo npm install -g "pnpm@${PNPM_VERSION}" >/dev/null
fi
PNPM_BIN="$(command -v pnpm)"
node -v && pnpm -v && echo "  pnpm at ${PNPM_BIN}"

# ---------------------------------------------------------------- app dir
say "Application directory ${APP_DIR}"
sudo mkdir -p "$APP_DIR"
sudo chown "$APP_USER":"$APP_USER" "$APP_DIR"

# -------------------------------------------------------------- environment
say "Environment file"
if [ -f "${APP_DIR}/.env.production" ]; then
  echo "  exists already, left untouched"
else
  SECRET="$(openssl rand -base64 32)"
  cat > "${APP_DIR}/.env.production" <<EOF
# Written by provision-ec2.sh. Keep this file out of git.
APP_ENV=production
NODE_ENV=production
PORT=3000
AUTH_SECRET=${SECRET}

# REQUIRED. The app refuses to start without it, because the fallback writes
# to a directory inside the working tree and a deploy would delete it.
DATABASE_URL=
EOF
  chmod 600 "${APP_DIR}/.env.production"
  echo "  written, with a freshly generated AUTH_SECRET"
  echo "  !! DATABASE_URL is empty. Fill it in before deploying."
fi

# ------------------------------------------------------------------ systemd
say "systemd unit"
sudo tee /etc/systemd/system/yatra.service >/dev/null <<EOF
[Unit]
Description=Ekatma Yatra
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env.production
ExecStart=${PNPM_BIN} start
Restart=always
RestartSec=3
User=${APP_USER}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable yatra >/dev/null
echo "  enabled (not started: there is nothing built yet)"

# -------------------------------------------------------------------- nginx
say "nginx for ${DOMAIN}"
# AL2023's nginx reads /etc/nginx/conf.d/*.conf and has no sites-enabled.
if [ "$PKG" = dnf ]; then
  CONF=/etc/nginx/conf.d/yatra.conf
else
  CONF=/etc/nginx/sites-available/yatra
fi
sudo tee "$CONF" >/dev/null <<EOF
# Rate-limit the one unauthenticated endpoint that hashes a password.
limit_req_zone \$binary_remote_addr zone=login:10m rate=10r/m;

server {
  listen 80;
  server_name ${DOMAIN};

  # Server Actions accept 2 MB; leave headroom for the multipart wrapper.
  client_max_body_size 4m;

  location = /login {
    limit_req zone=login burst=5 nodelay;
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  # Build output is content-hashed, so it can be cached hard.
  location /_next/static/ {
    proxy_pass http://127.0.0.1:3000;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
EOF
if [ "$PKG" = apt ]; then
  sudo ln -sf "$CONF" /etc/nginx/sites-enabled/yatra
  sudo rm -f /etc/nginx/sites-enabled/default
fi
# SELinux on AL2023 must allow nginx to talk to the app on 127.0.0.1:3000.
if command -v setsebool >/dev/null 2>&1; then
  sudo setsebool -P httpd_can_network_connect 1 2>/dev/null || true
fi
sudo nginx -t
sudo systemctl enable --now nginx >/dev/null
sudo systemctl reload nginx

# ------------------------------------------------------------------ certbot
say "certbot"
if ! command -v certbot >/dev/null 2>&1; then
  if [ "$PKG" = dnf ]; then
    sudo dnf install -y -q certbot python3-certbot-nginx
  else
    sudo snap install --classic certbot && sudo ln -sf /snap/bin/certbot /usr/bin/certbot
  fi
fi
echo "  installed; run it once ${DOMAIN} resolves to this instance"

say "Done"
cat <<EOF

Next, in order:

  1. Put the code in ${APP_DIR}
       git clone https://github.com/Shashank3366999/ekatmya-yatra.git ${APP_DIR}

  2. Fill in DATABASE_URL in ${APP_DIR}/.env.production

  3. Release
       bash ${APP_DIR}/scripts/deploy.sh

  4. TLS, once ${DOMAIN} resolves to this instance
       sudo certbot --nginx -d ${DOMAIN}

EOF
