import { createApp } from './app';
import { connectDB } from './config/db';
import { seedIfEmpty } from './seed';

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/memeforge';
const APP_VERSION = process.env.APP_VERSION ?? '1.0.0';

function main(): void {
  const app = createApp();

  // Start serving immediately so /healthz is live while Mongo connects.
  const server = app.listen(PORT, HOST, () => {
    console.log(`MemeForge CMS v${APP_VERSION} listening on http://${HOST}:${PORT}`);
  });

  connectDB(MONGODB_URI)
    .then(() => seedIfEmpty())
    .catch((err) => console.error('Startup DB error:', err));

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down`);
    server.close(() => process.exit(0));
  };
  (['SIGTERM', 'SIGINT'] as const).forEach((sig) => process.on(sig, () => shutdown(sig)));
}

main();
