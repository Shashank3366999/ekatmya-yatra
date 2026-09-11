# Deploying Ekatma Yatra to EC2

Written for a single EC2 instance behind nginx, with Postgres on RDS. It is one
Next.js process; there is no separate API or worker to place.

---

## 1. What we still need from you

Everything below is a decision or a credential only the Yatra team can give.
The first four block the deployment; the rest do not.

| # | What | Why |
| --- | --- | --- |
| 1 | **An A record for `ekatmayatra.xoidlabs.com`** | Pointing at the instance's Elastic IP. Certbot cannot issue a certificate until it resolves. Whoever runs DNS for `xoidlabs.com` has to add it. |
| 1b | **The instance's public IP or DNS name, its region, and its AMI** | Needed to connect at all. The keypair is here; the address is not. |
| 2 | **A Postgres database** | RDS Postgres 16, same VPC as the instance. We need the endpoint, database name, user and password. See §3 for why not on the instance. |
| 3 | **The real first admin** | Name, email and a password they will change. The seeded `admin@ekatmadham.com / Yatra@2026` is a development account and must not exist in production. |
| 4 | **Instance size confirmed** | `t3.small` (2 GB) can run the app but cannot reliably build it. See §2. |
| 5 | Email or SMS provider | Approvals and announcements currently notify inside the panel only. Nothing is sent. Pick a provider (SES is the obvious one on AWS) and the switches in `/admin/automations` become real sends. `TEAM-QUESTIONS.md` Q8. |
| 6 | Where the 86 MB film is hosted | The site ships only its opening two minutes and does not need the full film. If it should be watchable, it belongs on YouTube or a CDN, not on this instance. Q7b. |
| 7 | An S3 bucket, eventually | Survey photographs are URLs in the schema; nothing uploads yet. The day someone needs to attach a photo from the field, that needs a bucket and a signed-upload route. Q7. |
| 8 | Whether the Admin Panel gets its own hostname | `admin.ekatmayatra.xoidlabs.com` was discussed. It is one nginx server block; the app already keeps `/admin` behind sign-in and the landing page never links to it. Q13. |

---

## 1b. Settled already

| | |
| --- | --- |
| Domain | `ekatmayatra.xoidlabs.com` |
| SSH key | `Ekatmya.pem`, a 2048-bit RSA keypair, in the project root |

The key is `chmod 600` and git-ignored by pattern (`*.pem`, `*.key`, `id_rsa*`),
and it has never been committed — checked against the whole history, not just
the working tree. It is worth moving it out of the repository anyway:

```sh
mkdir -p ~/.ssh && mv Ekatmya.pem ~/.ssh/ && chmod 600 ~/.ssh/Ekatmya.pem
```

A key inside a working tree is one `git add -f` or one copied folder away from
being shared, and git history keeps whatever it is given. Connecting looks the
same either way:

```sh
ssh -i ~/.ssh/Ekatmya.pem ubuntu@<instance-ip>     # ubuntu@ for an Ubuntu AMI
ssh -i ~/.ssh/Ekatmya.pem ec2-user@<instance-ip>   # ec2-user@ for Amazon Linux
```

If it refuses with `UNPROTECTED PRIVATE KEY FILE`, the mode is not 600.

---

## 2. The instance

- **OS:** Ubuntu 24.04 LTS.
- **Size:** `t3.medium` (2 vCPU, 4 GB) to build and run on the same box.
  `next build` is the memory-hungry step; on a 2 GB instance it is likely to be
  killed by the OOM reaper. If `t3.small` is a firm constraint, either add 2 GB
  of swap before building, or build elsewhere and copy `.next` across.
- **Disk:** 20 GB gp3. The repository carries about 60 MB of photographs and the
  two video renditions; `node_modules` is roughly 700 MB.
- **Security group:**
  - inbound `22` from your own IP only,
  - inbound `80` and `443` from anywhere,
  - **not** `3000` from anywhere. Node listens on `127.0.0.1` and nginx is the
    only thing the internet talks to.
- **Elastic IP**, so the DNS record survives a stop/start.

---

## 3. The database

Use **RDS Postgres 16**, in the same VPC, not publicly accessible, with a
security group that allows `5432` only from the instance's security group.

Postgres on the instance itself would work and is cheaper, but it puts the data
on the same disk as the deploy, gives up automated backups and point-in-time
restore, and makes replacing the instance a data migration. For a Yatra that
collects survey entries from several hundred people, that trade is not worth it.

Turn on automated backups with at least 7 days of retention.

> **Not verified here.** The app has two drivers and picks by `DATABASE_URL`,
> and the schema and migrations are plain Postgres, so a real server is what it
> was written for. But every run so far has been against PGlite: there is no
> Postgres this machine can reach, so §5 step 3 is the first real exercise of
> that path. Treat the migration output as the thing to check, not to assume.

---

## 4. Software on the box

```sh
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git ca-certificates curl unattended-upgrades

# Node 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable && corepack prepare pnpm@10.24.0 --activate

node -v   # expect v22.x
pnpm -v   # expect 10.24.0
```

---

## 5. First deploy

Two scripts do the work. Both are idempotent and both refuse rather than guess.

```sh
# on the instance, once
bash scripts/provision-ec2.sh      # Node, pnpm, nginx, systemd, .env.production

# fill in DATABASE_URL, then, for this and every later release
bash scripts/deploy.sh             # pull, install, migrate, seed, build, restart
```

`deploy.sh` stops before touching anything if `DATABASE_URL` is empty, if
`APP_ENV` is not `production`, or if `AUTH_SECRET` is still the published
example value. It ends by checking the app actually answers, and points at
`journalctl -u yatra` if it does not.

The rest of this section is what those scripts do, for when something needs
doing by hand.

### By hand

```sh
# 1 — the code
sudo mkdir -p /srv/yatra && sudo chown $USER /srv/yatra
git clone <repo-url> /srv/yatra && cd /srv/yatra
pnpm install --frozen-lockfile

# 2 — the environment. Never commit this file.
cat > /srv/yatra/.env.production <<'EOF'
APP_ENV=production
NODE_ENV=production
PORT=3000
AUTH_SECRET=<paste `openssl rand -base64 32`>
DATABASE_URL=postgresql://USER:PASSWORD@your-rds-endpoint:5432/ekatmya_yatra
EOF
chmod 600 /srv/yatra/.env.production

# 3 — the schema. THIS IS THE STEP TO WATCH: it is the first time the
#     migrations run against a real Postgres. Expect "migrations applied".
set -a && . /srv/yatra/.env.production && set +a
pnpm db:migrate

# 4 — reference data: states, districts, the 21 route stops, the heritage
#     sites, the automation registry, the two predefined roles.
#     Demo accounts are skipped automatically when DATABASE_URL is set: they
#     carry a password that is written down in this repository.
pnpm db:seed

# 5 — the real admin. Register through the UI first, then promote:
pnpm db:promote <their-email> super_admin

# 6 — build
pnpm build
```

`APP_ENV=production` is what makes the app refuse to start if `DATABASE_URL` is
missing or if `AUTH_SECRET` is still the example value from `.env.example`. Both
of those would otherwise fail silently and expensively: the first writes every
account to a file that the next deploy deletes, the second signs session
cookies with a key that is published in this repository.

---

## 6. Run it as a service

`/etc/systemd/system/yatra.service`:

```ini
[Unit]
Description=Ekatma Yatra
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/yatra
EnvironmentFile=/srv/yatra/.env.production
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=3
User=ubuntu
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now yatra
sudo systemctl status yatra
journalctl -u yatra -f        # the app's log
```

---

## 7. nginx and TLS

`/etc/nginx/sites-available/yatra`:

```nginx
server {
  listen 80;
  server_name ekatmayatra.xoidlabs.com;

  # Server Actions accept up to 2 MB; leave headroom for the multipart wrapper.
  client_max_body_size 4m;

  # Next's build output is content-hashed, so it can be cached hard.
  location /_next/static/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_cache_valid 200 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

```sh
sudo ln -s /etc/nginx/sites-available/yatra /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# TLS, once the A record resolves to this instance
sudo snap install --classic certbot && sudo ln -sf /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d ekatmayatra.xoidlabs.com
```

Certbot installs its own renewal timer. Check it with
`sudo certbot renew --dry-run`.

---

## 8. Verifying the deployment

Run the suites against a **staging** URL, never production:

```sh
BASE_URL=https://staging.ekatmayatra.xoidlabs.com pnpm test:e2e
BASE_URL=https://staging.ekatmayatra.xoidlabs.com pnpm test:consistency
BASE_URL=https://staging.ekatmayatra.xoidlabs.com pnpm test:mobile
BASE_URL=https://staging.ekatmayatra.xoidlabs.com pnpm test:responsive
pnpm test:contrast          # offline, reads the palette
```

`test:e2e` **registers accounts and approves organisers**, and the other three
sign in as the demo accounts, which production does not have. Against
production they would either fail or leave test records in the Yatra's own data.

On production, check by hand: the landing page loads, an account can register,
an admin can sign in and see the panel, and `journalctl -u yatra` is quiet.

---

## 9. Updating

```sh
cd /srv/yatra
git pull
pnpm install --frozen-lockfile
set -a && . .env.production && set +a
pnpm db:migrate          # no-op when there are no new migrations
pnpm build
sudo systemctl restart yatra
```

That restart is a few seconds of downtime. If that becomes unacceptable, build
into a second directory and swap a symlink before restarting, or put two
instances behind a load balancer.

---

## 10. Before real people use it

- [ ] Delete `admin@ekatmadham.com` once a real super-admin exists.
- [ ] Confirm no account still has the password `Yatra@2026`.
- [ ] RDS automated backups on, retention set.
- [ ] `unattended-upgrades` enabled for security patches.
- [ ] SSH by key only: `PasswordAuthentication no` in `sshd_config`.
- [ ] Rate-limit `/login` in nginx (`limit_req_zone`), since it is the one
      unauthenticated endpoint that touches password hashing.
- [ ] Decide on the notification provider (§1.5), or tell the team plainly that
      approvals must be watched for in the panel.
- [ ] Replace the two placeholder roles at `/admin/roles` with the real ones.
      Joiners see them.

---

## What is deliberately not here

**Docker.** One Node process and a managed database do not need it, and it would
add a build step and an image registry to a deployment one person will maintain.

**A CDN.** nginx serving content-hashed assets from the instance is enough at
this scale. If the Yatra makes the news, put CloudFront in front of the same
instance; nothing in the app has to change.

**PM2.** systemd already does restarts, boot ordering and logs, and it is
already on the box.
