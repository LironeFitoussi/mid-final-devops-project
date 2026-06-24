import path from 'path';
import fs from 'fs';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import memesRouter, { categories } from './routes/memes';
import { isDbConnected } from './config/db';

const APP_VERSION = process.env.APP_VERSION ?? '1.0.0';
const STARTED_AT = new Date();

export function createApp(): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.disable('x-powered-by');

  // --- Operational endpoints ---------------------------------------------
  // Liveness: the process is up. Returns 200 regardless of DB state so a
  // transient Mongo outage doesn't get the pod killed (matches the lab's
  // /healthz readiness contract while avoiding crash loops on startup).
  app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }));

  // Readiness (DB-aware) — recommended target if you gate traffic on Mongo.
  app.get('/readyz', (_req, res) => {
    const ok = isDbConnected();
    res.status(ok ? 200 : 503).json({ status: ok ? 'ready' : 'not-ready' });
  });

  app.get('/version', (_req, res) =>
    res.json({
      version: APP_VERSION,
      startedAt: STARTED_AT.toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    })
  );

  // --- Content API --------------------------------------------------------
  app.get('/api/categories', (_req, res) => res.json(categories));
  app.use('/api/memes', memesRouter);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // --- Static client (present in the production image only) ---------------
  const publicDir = path.join(__dirname, '..', 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    // SPA fallback for client-side routes.
    app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
  }

  // --- Error handler ------------------------------------------------------
  app.use((err: Error & { status?: number; name: string }, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.name === 'ValidationError' ? 400 : err.status ?? 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: err.message || 'Server error' });
  });

  return app;
}
