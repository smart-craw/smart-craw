import path from "path";
const dbName = "bots.db";
export const dbPath = process.env.DB_LOCATION
  ? path.join(process.env.DB_LOCATION, dbName)
  : dbName;
