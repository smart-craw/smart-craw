"use strict";
import { DatabaseSync } from "node:sqlite";
const database = new DatabaseSync("bots.db");

// Execute SQL statements from strings.
// id is a uuid
database.exec(`
  CREATE TABLE IF NOT EXISTS bots(
    id TEXT PRIMARY KEY,
    description TEXT not null,
    name TEXT not null,
    instructions TEXT not null,
    deleted INTEGER not null
  ) STRICT
`);

//TODO add FK to bots table
database.exec(`
  CREATE TABLE IF NOT EXISTS bot_schedule(
    id TEXT PRIMARY KEY,
    cron TEXT
  ) STRICT
`);
