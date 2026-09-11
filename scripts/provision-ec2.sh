#!/usr/bin/env bash
#
# One-time setup for the EC2 instance that serves Ekatma Yatra.
#
# Run it on the instance, as the login user (ubuntu), from anywhere:
#
#   sudo -v                       # so the prompt comes early, not mid-run
#   bash provision-ec2.sh
#
# Idempotent: safe to run again. It installs nothing it finds already present,
# and it will not overwrite /srv/yatra/.env.production if that exists.
set -euo pipefail

DOMAIN="${DOMAIN:-ekatmayatra.xoidlabs.com}"
APP_DIR="${APP_DIR:-/srv/yatra}"
APP_USER="${APP_USER:-$(id -un)}"
NODE_MAJOR=22
PNPM_VERSION=10.24.0

say() { printf '\n\033[1m→ %s\033[0m\n' "$*"; }

say "System packages"
sudo apt-get update -qq
sudo apt-get install -y -qq nginx git curl ca-certificates unattended-upgrades

say "Node ${NODE_MAJOR} and pnpm ${PNPM_VERSION}"
if ! node -v 2>/dev/null | grep -q "^v${NODE_MAJOR}\."; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi
sudo corepack enable
corepack prepare "pnpm@${PNPM_VERSION}" --activate
node -v && pnpm -v

say "Application directory ${APP_DIR}"
sudo mkdir -p "$APP_DIR"
sudo chown "$APP_USER":"$APP_USER" "$APP_DIR"

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

say "systemd unit"
sudo tee /etc/systemd/system/yatra.service >/dev/null <<EOF
[Unit]
Description=Ekatma Yatra
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env.production
ExecStart=/usr/bin/pnpm start
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

say "nginx for ${DOMAIN}"
sudo tee /etc/nginx/sites-available/yatra >/dev/null <<EOF
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
sudo ln -sf /etc/nginx/sites-available/yatra /etc/nginx/sites-enabled/yatra
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

say "Done"
cat <<EOF

Next, in order:

  1. Put the code in ${APP_DIR}
       git clone <repo-url> ${APP_DIR}

  2. Fill in DATABASE_URL in ${APP_DIR}/.env.production

  3. Release
       bash ${APP_DIR}/scripts/deploy.sh

  4. TLS, once ${DOMAIN} resolves to this instance
       sudo snap install --classic certbot
       sudo ln -sf /snap/bin/certbot /usr/bin/certbot
       sudo certbot --nginx -d ${DOMAIN}

EOF
