# Live hub — production deployment runbook

Deploys the live price hub to a fixed-IP host behind HTTPS, then points the
Vercel frontend at it. The hub is **additive + feature-flagged**: production is
unaffected until `NEXT_PUBLIC_LIVE_HUB_URL` is set, and unsetting it rolls back
instantly.

## Prerequisites (you must provide)
- A host with a **stable public IP** (small VPS — Hetzner/DigitalOcean/Vultr ~$4–6/mo, or Oracle Always Free). Render is unsuitable (no static outbound IP; free tier sleeps).
- A **domain/subdomain** for the hub (e.g. `live.yourdomain.com`) — required because the browser can't open SSE from an `https://` site to a plain-`http` hub.
- SSH access to the host.

## 1. Whitelist the host IP in SmartAPI
SmartAPI portal → your app → **Primary Static IP** = the host's public IP.
⚠️ Changeable only **once per week** — set it once to the final host IP.

## 2. Base setup (Ubuntu 22.04+)
```bash
sudo apt update && sudo apt install -y git caddy
# Node 22 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo useradd -m -s /bin/bash ultra || true
sudo mkdir -p /opt/ultra-scanner && sudo chown ultra:ultra /opt/ultra-scanner
```

## 3. Clone + install
```bash
sudo -u ultra git clone https://github.com/mayankksingh5/nse-breakout-scanner /opt/ultra-scanner
cd /opt/ultra-scanner/backend
sudo -u ultra npm ci
```

## 4. Configure `backend/.env` (git-ignored)
```
SMARTAPI_API_KEY=...
SMARTAPI_CLIENT_CODE=...
SMARTAPI_PIN=...
SMARTAPI_TOTP_SECRET=...
LIVE_HUB_PORT=8080
ALLOWED_ORIGIN=https://stockfinder-nse.vercel.app
```
Keep values clean (no inline comments). These can place trades — host-only, never in git/frontend.

## 5. DNS
Add an **A record**: `live.yourdomain.com` → host public IP. Wait for it to resolve.

## 6. HTTPS via Caddy
Edit `deploy/Caddyfile`, replace `live.example.com` with your domain, then:
```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy   # auto-obtains the TLS cert
```

## 7. Run under a process manager (pick one)
**systemd:**
```bash
sudo cp deploy/ultra-live.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ultra-live
journalctl -u ultra-live -f
```
**or pm2:**
```bash
pm2 start deploy/ecosystem.config.cjs && pm2 startup && pm2 save
```

## 8. Verify the hub (on the host / over HTTPS)
```bash
curl https://live.yourdomain.com/health         # -> {"ok":true,"connected":true,...}
curl https://live.yourdomain.com/api/live | head
```
During market hours (09:00–15:30 IST) `connected:true` and `lastTickAt` advances.

## 9. Point the frontend at the hub
Vercel → project **frontend** → Settings → Environment Variables →
`NEXT_PUBLIC_LIVE_HUB_URL = https://live.yourdomain.com` (Production) → **redeploy**.

## 10. End-to-end verification
- Dashboard: live stock prices + indices tick, LIVE pill shows.
- Detail pages: live header price/change%.
- SSE: `curl -N https://live.yourdomain.com/live` streams a `snapshot` then ticks.
- Health: `/health` → `connected:true`.
- Reconnect: `sudo systemctl restart ultra-live` → site's LIVE pill drops then returns.
- Fallback: stop the hub → site keeps serving the static snapshot, no errors.

## Rollback
- **Fastest (no redeploy):** in Vercel, **remove** `NEXT_PUBLIC_LIVE_HUB_URL` and redeploy → overlay gone, static snapshot remains. Or stop the hub (`systemctl stop ultra-live`) → frontend falls back automatically.
- **Code:** revert the `feature/live-data-hub` merge commit on `main` and let Vercel redeploy.
- The daily EOD refresh pipeline is independent and unaffected by any of this.

## Known limitations
- Single SmartAPI account → one feed session (3 sockets / 1000 tokens each); we stream ~145. Not per-user data.
- Personal/login-gated posture: do **not** redistribute live ticks to the anonymous public (NSE/SEBI). Gate the overlay or show delayed data publicly.
- Static IP changeable only once/week — avoid host IP churn.
