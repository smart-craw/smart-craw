"use strict";
import { DatabaseSync } from "node:sqlite";
const database = new DatabaseSync("bots.db");

// Create a prepared statement to insert data into the database.
export const insertBot = database.prepare(
  "INSERT INTO bots (key, description, name, instructions) VALUES (?, ?, ?, ?)",
);

export const getBot = database.prepare(
  "SELECT key, description, name, instructions from bots where key=?",
);
// Execute the prepared statement with bound values.
/*insertBot.run(1, "hello");
insertBot.run(2, "world");*/
// Create a prepared statement to read data from the database.
/*const query = database.prepare("SELECT * FROM data ORDER BY key");
// Execute the prepared statement and log the result set.
console.log(query.all());*/
// Prints: [ { key: 1, value: 'hello' }, { key: 2, value: 'world' } ]
