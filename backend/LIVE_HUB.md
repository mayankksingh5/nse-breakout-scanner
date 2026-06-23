# Live price hub (Phase 1)

Real-time price overlay for Ultra Scanner, backed by Angel One SmartAPI.
Read-only: it streams prices only and never places orders, and it does **not**
touch the daily scanner or breakout scoring.

## What it does

```
Angel One SmartAPI WS  ──(1 upstream socket, LTP)──►  Live hub (this process)
                                                       • in-memory price map
                                                       • change% vs snapshot prev_close
                                                       └──► SSE / REST ──► frontend overlay
```

- Streams only what the dashboard shows: the daily scan's signals + the index
  strip (~145 tokens — well under the 1000/socket limit).
- Computes change% locally from the committed snapshot's `prev_close`, so it
  only needs the lightweight LTP feed.
- The static `signals.json` still drives the scanner, signals, and history.
  If the hub is down, the frontend falls back to that snapshot.

## Run locally

```bash
cd backend
# requires .env with SMARTAPI_* (see .env.example)
npm run live          # or: npm run live:watch
```

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness + hub status (host health check) |
| GET | `/api/live/health` | Hub status only |
| GET | `/api/live` | Snapshot of all current live prices + health |
| GET | `/live` | Server-Sent Events: initial `snapshot` event, then a `data:` line per tick |

## Environment variables

| Var | Required | Notes |
| --- | --- | --- |
| `SMARTAPI_API_KEY` | yes | SmartAPI app key |
| `SMARTAPI_CLIENT_CODE` | yes | Angel One login/client ID |
| `SMARTAPI_PIN` | yes | login PIN |
| `SMARTAPI_TOTP_SECRET` | yes | base32 TOTP seed (not a 6-digit code) |
| `LIVE_HUB_PORT` | no | default 8080 |
| `ALLOWED_ORIGIN` | prod | CORS allow-list, comma-separated; blank = allow all (dev only) |
| `DATASET_PATH` | no | override snapshot path; blank = `../frontend/src/data/signals.json` |

> Credentials can place trades — treat them as a trading password. Keep them
> only on the hub host; never in frontend (`NEXT_PUBLIC_*`) or git.

## Auth, token refresh, reconnection

- **Login:** API key + client code + PIN + an in-code TOTP (`otplib`), exchanged
  for a daily `feedToken`.
- **Daily refresh:** a cron at **08:30 IST** (weekdays) re-logs in and reconnects
  (feed tokens expire daily); it also reloads the dataset so the live symbol set
  follows the latest scan.
- **Reconnection:** SDK-level exponential auto-reconnect + re-subscribe handles
  transient drops; a failed daily login is retried at the next boot/cron.

## Deployment (fixed-IP host)

The SmartAPI app is locked to a **static IP** (changeable only once/week), so the
hub must run on a host with a stable outbound IP (small VPS, or Fly.io with a
dedicated IP). Steps:

1. Provision the host; note its public IP.
2. In the SmartAPI portal, set the app's **Primary Static IP** to that IP.
3. Clone the repo, `cd backend && npm ci`.
4. Create `.env` (see table above) with `ALLOWED_ORIGIN=https://stockfinder-nse.vercel.app`.
5. `npm run live` under a process manager (pm2/systemd) with restart-on-failure.
6. Health check: `GET /health` should report `connected:true` during market hours.
7. Point the frontend at it via `NEXT_PUBLIC_LIVE_HUB_URL` (Phase 2).

## Rollback

The hub is **additive and isolated** — nothing in the deployed app depends on it
yet (the frontend overlay lands in Phase 2 behind `NEXT_PUBLIC_LIVE_HUB_URL`):

- **Disable:** stop the hub process (pm2/systemd). The site keeps serving the
  static snapshot; no redeploy needed.
- **Frontend (after Phase 2):** unset `NEXT_PUBLIC_LIVE_HUB_URL` and redeploy —
  the overlay disappears, snapshot remains.
- **Code:** the whole feature lives on the `feature/live-data-hub` branch; `main`
  is untouched until you merge.
