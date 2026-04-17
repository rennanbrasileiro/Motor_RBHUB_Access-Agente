"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loadConfig_1 = require("./config/loadConfig");
const database_1 = require("./storage/database");
const App_1 = require("./core/App");
async function bootstrap() {
    const config = (0, loadConfig_1.loadConfig)();
    const db = (0, database_1.createDatabase)(config);
    const app = new App_1.App(config, db);
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
