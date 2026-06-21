# Deploying the live link

**Why this setup:** Yahoo Finance blocks requests from cloud/datacenter IPs
(Render, Vercel, GitHub Actions all get `429 Failed to get crumb`). So we
**scan locally** — where Yahoo works — and **serve the precomputed results**
from the website. The dashboard is a single Next.js app on **Vercel**: instant
loads, no backend, no cold starts.

The Express backend in `backend/` is now only a **local tool** to generate the
dataset. It is not deployed.

---

## Deploy the dashboard (Vercel)

1. Go to <https://vercel.com> → log in with **GitHub**.
2. **Add New… → Project** → import **`nse-breakout-scanner`**.
3. Set **Root Directory = `frontend`** (important). Framework auto-detects as Next.js.
4. Click **Deploy**. No environment variables needed.
5. You get a public link like `https://nse-breakout-scanner.vercel.app` — **that's what you share.**

Every `git push` to `main` auto-redeploys.

---

## Refreshing the data (run on your own machine)

The numbers come from a committed dataset (`frontend/src/data/signals.json`).
To update it with the latest market data:

```bash
cd backend
npm install        # first time only
npm run refresh    # runs a full local scan (~40s), writes the new dataset

cd ..
git add -A
git commit -m "refresh data"
git push           # Vercel redeploys automatically
```

Do this whenever you want fresh signals (e.g. after market close).

---

## The Render backend (optional / can be deleted)

The earlier Render service can't fetch Yahoo data (cloud IP block), so it
returns 0 signals and isn't used by the site. You can safely **delete it** in
the Render dashboard. The `render.yaml` is kept only for reference.
