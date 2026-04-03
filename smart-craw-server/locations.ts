import path from "path";
const dbName = "bots.db";
export const dbPath = process.env.DB_LOCATION
  ? path.join(process.env.DB_LOCATION, dbName)
  : dbName;

export const uiPath =
  process.env.STATIC_HTML_LOCATION ||
  path.join(import.meta.dirname, "../smart-craw-ui/dist");

export const botPath = process.env.BOT_LOCATION || import.meta.dirname;
