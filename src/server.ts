import { buildApp } from './app';
import { loadEnv } from './config/env';
import { closeDatabaseConnection } from './infrastructure/database/prisma';
import { closeRedisConnection } from './infrastructure/redis/client';

async function start(): Promise<void> {
  const env = loadEnv();
  const app = await buildApp({ env });

  const shutdown = async (): Promise<void> => {
    app.log.info('Shutting down FlowPilot AI API');
    await app.close();
    await closeDatabaseConnection();
    await closeRedisConnection();
  };

  process.on('SIGINT', () => {
    void shutdown().then(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    void shutdown().then(() => process.exit(0));
  });

  await app.listen({
    host: env.HOST,
    port: env.PORT,
  });
}

void start().catch((error) => {
  console.error(error);
  process.exit(1);
});
