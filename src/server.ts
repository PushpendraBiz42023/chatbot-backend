import "reflect-metadata";
import { createApp } from "./app";
import { AppDataSource } from "./database/data-source";
import { env } from "./config/env";

async function bootstrap(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("[Database] Connected to MySQL");
  } catch (error) {
    console.error("[Database] Failed to connect:", error);
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[Server] Listening on port ${env.port} (${env.nodeEnv})`);
  });
}

bootstrap();
