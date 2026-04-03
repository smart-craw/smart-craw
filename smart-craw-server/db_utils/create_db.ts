"use strict";
import { DatabaseSync } from "node:sqlite";
import { dbPath } from "../locations.ts";
const database = new DatabaseSync(dbPath);

// Execute SQL statements from strings.
// id is a uuid
database.exec(`
  CREATE TABLE IF NOT EXISTS bots(
    id TEXT PRIMARY KEY,
    description TEXT not null,
    name TEXT not null,
    instructions TEXT not null,
    deleted INTEGER not null
  )
`);

database.exec(`
  CREATE TABLE IF NOT EXISTS bot_schedule(
    id TEXT PRIMARY KEY,
    cron TEXT,
    FOREIGN KEY(id) REFERENCES bots(id) ON DELETE CASCADE
  )
`);

database.exec(`
  CREATE TABLE IF NOT EXISTS bot_messages(
    id TEXT PRIMARY KEY,
    bot_id TEXT not null,
    message TEXT not null,
    reasoning TEXT not null,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY(bot_id) REFERENCES bots(id) ON DELETE CASCADE
  )
`);
