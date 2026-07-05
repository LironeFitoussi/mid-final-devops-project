import mongoose from 'mongoose';

/**
 * Connect to MongoDB with exponential backoff. The HTTP server is started
 * independently of this, so the pod stays alive (and /healthz keeps returning
 * 200) while Mongo becomes reachable — avoiding a crash loop in Kubernetes when
 * the database isn't ready yet.
 */
export async function connectDB(uri: string): Promise<void> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => console.log('MongoDB connected'));
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));

  let attempt = 0;
  for (;;) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      return;
    } catch (err) {
      attempt += 1;
      const waitMs = Math.min(30_000, 2 ** attempt * 1000);
      console.error(
        `MongoDB connection failed (attempt ${attempt}): ${(err as Error).message}. Retrying in ${waitMs}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
