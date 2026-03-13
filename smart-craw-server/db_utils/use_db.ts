"use strict";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import type { BotOutput, MessageOutput } from "../models.ts";
const database = new DatabaseSync("bots.db");

// Create a prepared statement to insert data into the database.
const insertBotDb = database.prepare(
  "INSERT INTO bots (id,  name, description, instructions, deleted) VALUES (?, ?, ?, ?, 0)",
);

const getBotDb = database.prepare(
  "SELECT id, description, name, instructions from bots where id=?",
);

const getBotsDb = database.prepare(
  "SELECT id, description, name, instructions from bots where deleted=0",
);

const removeBotDb = database.prepare("DELETE from bots where id=?");

const insertMessageDb = database.prepare(
  "INSERT INTO bot_messages (id, bot_id, message, reasoning) VALUES (?, ?, ?, ?)",
);

const getMessagesDb = database.prepare(
  "SELECT id, message, reasoning, timestamp FROM bot_messages where bot_id=? ORDER BY timestamp DESC",
);

export const insertBot = (
  id: string,
  name: string,
  description: string,
  instructions: string,
) => {
  insertBotDb.run(id, name, description, instructions);
};

export const getBot = (id: string) => {
  return getBotDb.get(id) as BotOutput;
};

export const getBots = () => {
  return getBotsDb.all() as BotOutput[];
};

export const removeBot = (id: string) => {
  removeBotDb.run(id);
};

export const insertMessage = (
  botId: string,
  message: string,
  reasoning: string,
) => {
  console.log("inserting message");
  console.log(message);
  console.log(reasoning);
  insertMessageDb.run(randomUUID(), botId, message, reasoning);
};

export const getMessages = (id: string) => {
  // @ts-expect-error - type definition bug with .all() positional arguments
  return getMessagesDb.all(id) as MessageOutput[];
};
