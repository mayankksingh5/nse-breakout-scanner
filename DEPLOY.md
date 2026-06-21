# Deploying the live link

Two pieces get deployed:

- **Backend** (the scanner) → **Render**
- **Frontend** (the dashboard people see) → **Vercel**

You deploy the backend first, then point the frontend at it.

---

## Step 1 — Deploy the backend on Render

1. Go to <https://render.com> and sign up / log in with your **GitHub** account.
2. Click **New +** → **Blueprint**.
3. Pick the repo **`mayankksingh5/nse-breakout-scanner`**. Render reads `render.yaml` automatically.
4. Click **Apply**. It creates a service called `nse-breakout-scanner-api`.
5. Wait for the first deploy to finish (a few minutes). When it's live, copy the URL — it looks like:

   ```
   https://nse-breakout-scanner-api.onrender.com
   ```

6. Test it: open `https://<your-render-url>/api/status` in a browser. You should see JSON.
   The first scan runs automatically on startup (~40s), then `/api/signals` fills up.

> Free tier note: the backend **sleeps after 15 min of no traffic**. The next visit wakes it
> (takes ~30–60s and re-scans). That's normal for free hosting.

---

## Step 2 — Deploy the frontend on Vercel

1. Go to <https://vercel.com> and sign up / log in with **GitHub**.
2. Click **Add New…** → **Project**, then **Import** the same repo.
3. In the import screen set:
   - **Root Directory** → `frontend`   ← important
   - Framework Preset → **Next.js** (auto-detected)
4. Expand **Environment Variables** and add:
   - **Name:** `BACKEND_URL`
   - **Value:** your Render URL from Step 1 (e.g. `https://nse-breakout-scanner-api.onrender.com`)
5. Click **Deploy**.
6. When it finishes you get your public link, e.g. `https://nse-breakout-scanner.vercel.app`.

**That link is what you share.** Anyone who opens it sees the live dashboard.

---

## Updating later

Both Render and Vercel auto-deploy on every `git push` to `main`. Just push and they rebuild.

## If the dashboard is empty
- Give it a minute on first load (backend waking + scanning).
- Click **Run Full Scan** in the top right.
- Check `https://<render-url>/api/status` — if `error` is not null, the scan hit an issue.
