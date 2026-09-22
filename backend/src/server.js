import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

const app = createApp();

async function main() {
  await connectDB();
  if (!env.cloudinaryConfigured) console.warn('! Cloudinary is not configured — media uploads will be rejected until CLOUDINARY_* is set.');
  const server = app.listen(env.PORT, () => console.log(`Agama API listening on :${env.PORT} (${env.NODE_ENV})`));
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}

main().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
