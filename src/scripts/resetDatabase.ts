import fs from "fs";
import path from "path";
import { loadConfig } from "../config/loadConfig";

const config = loadConfig();
const dbPath = path.resolve(config.storage.databasePath);
if (fs.existsSync(dbPath)) {
  fs.rmSync(dbPath);
  console.log(`Banco removido: ${dbPath}`);
} else {
  console.log(`Banco não encontrado: ${dbPath}`);
}
