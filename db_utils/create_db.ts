"use strict";
import { DatabaseSync } from "node:sqlite";
const database = new DatabaseSync("bots.db");

// Execute SQL statements from strings.
database.exec(`
  CREATE TABLE bots(
    id UUID PRIMARY KEY,
    description TEXT not null,
    name TEXT not null,
    instructions TEXT not null,
    deleted INTEGER not null
  ) STRICT
`);

//TODO add FK to bots table
database.exec(`
  CREATE TABLE bot_schedule(
    id UUID PRIMARY KEY,
    cron TEXT
  ) STRICT
`);
