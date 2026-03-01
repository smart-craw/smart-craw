"use strict";
import { DatabaseSync } from "node:sqlite";
const database = new DatabaseSync("bots.db");

// Execute SQL statements from strings.
database.exec(`
  CREATE TABLE bots(
    key UUID PRIMARY KEY,
    description TEXT,
    name TEXT,
    instructions TEXT
  ) STRICT
`);

//TODO add FK to bots table
database.exec(`
  CREATE TABLE bot_schedule(
    key UUID PRIMARY KEY,
    cron TEXT
  ) STRICT
`);
