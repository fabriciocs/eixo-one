import { buildServer } from './server.js';
import { env } from './config/env.js';

async function bootstrap() {
  const app = await buildServer();

  await app.listen({
    host: '0.0.0.0',
    port: env.PORT,
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});

