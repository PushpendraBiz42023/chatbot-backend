"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const app_1 = require("./app");
const data_source_1 = require("./database/data-source");
const env_1 = require("./config/env");
async function bootstrap() {
    try {
        await data_source_1.AppDataSource.initialize();
        console.log("[Database] Connected to MySQL");
    }
    catch (error) {
        console.error("[Database] Failed to connect:", error);
        process.exit(1);
    }
    const app = (0, app_1.createApp)();
    app.listen(env_1.env.port, () => {
        console.log(`[Server] Listening on port ${env_1.env.port} (${env_1.env.nodeEnv})`);
    });
}
bootstrap();
//# sourceMappingURL=server.js.map