/**
 * Live hub server (Phase 1) — the always-on process deployed on the fixed-IP host.
 *
 * Separate from the scanner's app.ts so it can be deployed and scaled
 * independently. Exposes a read-only price API + an SSE stream the frontend
 * overlays onto the static snapshot. Start with `npm run live`.
 *
 * Endpoints:
 *   GET /health           - liveness + hub status (for the host's health check)
 *   GET /api/live/health  - hub status only
 *   GET /api/live         - snapshot of all current live prices + health
 *   GET /live             - Server-Sent Events stream of price updates
 */
import 'dotenv/config';
import { join } from 'path';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { startHub, getSnapshot, getHealth, addListener, removeListener } from './services/live/liveHub';
import { LivePrice } from './types';

const app = express();

// Personal/login-gated posture: lock CORS to ALLOWED_ORIGIN (comma-separated)
// when set; otherwise reflect all (handy for local dev).
const allowed = process.env.ALLOWED_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors(allowed && allowed.length ? { origin: allowed } : {}));

// Local debug preview: a self-contained page that renders the live SSE stream.
// Handy for verifying the hub in a browser before the Phase 2 frontend overlay.
app.get('/preview', (_req: Request, res: Response) => {
  res.sendFile(join(__dirname, 'public', 'preview.html'));
});

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true, ...getHealth() }));
app.get('/api/live/health', (_req: Request, res: Response) => res.json(getHealth()));

app.get('/api/live', (_req: Request, res: Response) => {
  res.json({ prices: getSnapshot(), health: getHealth() });
});

// Server-Sent Events: one initial 'snapshot' event, then a 'data:' line per tick.
app.get('/live', (req: Request, res: Response) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // disable proxy buffering (nginx/hosts)
  });
  res.flushHeaders?.();

  res.write(`event: snapshot\ndata: ${JSON.stringify(getSnapshot())}\n\n`);

  const listener = (p: LivePrice) => res.write(`data: ${JSON.stringify(p)}\n\n`);
  addListener(listener);

  // Comment ping keeps idle proxies from closing the connection.
  const keepAlive = setInterval(() => res.write(`: ping\n\n`), 25_000);

  req.on('close', () => {
    clearInterval(keepAlive);
    removeListener(listener);
  });
});

const PORT = Number(process.env.LIVE_HUB_PORT || 8080);
app.listen(PORT, () => {
  console.log(`[live] hub server listening on :${PORT}`);
  startHub().catch((e) => console.error('[live] startHub failed:', e?.message || e));
});
