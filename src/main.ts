import { loadConfig } from "./config/loadConfig";
import { createDatabase } from "./storage/database";
import { App } from "./core/App";

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const db = createDatabase(config);
  const app = new App(config, db);

  process.on("SIGINT", async () => {
    await app.stop();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await app.stop();
    process.exit(0);
  });

  await app.start();
}

bootstrap().catch((error) => {
  console.error("Falha fatal ao iniciar o agente", error);
  process.exit(1);
});
