"use strict";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import type { BotOutput, MessageOutput } from "../../shared/models.ts";
import { dbPath } from "../locations.ts";
const database = new DatabaseSync(dbPath);
import { logger } from "../logging.ts";

// Create a prepared statement to insert data into the database.
const insertBotDb = database.prepare(
  `
INSERT INTO bots (id,  name, description, instructions, deleted)
VALUES (?, ?, ?, ?, 0) ON CONFLICT (id) DO UPDATE
SET name=?,
description=?,
instructions=?,
deleted=0
`,
);

const getBotDb = database.prepare(
  "SELECT id, description, name, instructions from bots where id=?",
);

const getBotsDb = database.prepare(
  "SELECT bots.id, description, name, instructions, cron from bots left join bot_schedule on bots.id=bot_schedule.id",
);

const removeBotDb = database.prepare("DELETE from bots where id=?");

const insertMessageDb = database.prepare(
  "INSERT INTO bot_messages (id, bot_id, message, reasoning) VALUES (?, ?, ?, ?)",
);

const insertCronDb = database.prepare(
  `
INSERT INTO bot_schedule (id, cron)
VALUES (?, ?) ON CONFLICT (id) DO UPDATE
set cron=?
`,
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
  try {
    insertBotDb.run(
      id,
      name,
      description,
      instructions,
      name,
      description,
      instructions,
    );
  } catch (error) {
    logger.error(`Error inserting bot ${id}:`, error);
  }
};

export const insertBotCron = (id: string, cron: string) => {
  try {
    insertCronDb.run(id, cron, cron);
  } catch (error) {
    logger.error(`Error inserting cron into ${id}:`, error);
  }
};

export const getBot = (id: string): BotOutput | undefined => {
  try {
    return getBotDb.get(id) as BotOutput;
  } catch (error) {
    logger.error(`Error getting bot ${id}:`, error);
    return undefined;
  }
};

export const getBots = (): BotOutput[] => {
  try {
    return getBotsDb.all() as BotOutput[];
  } catch (error) {
    logger.error("Error getting bots:", error);
    return [];
  }
};

export const removeBot = (id: string) => {
  try {
    removeBotDb.run(id);
  } catch (error) {
    logger.error(`Error removing bot ${id}:`, error);
  }
};

export const insertMessage = (
  botId: string,
  message: string,
  reasoning: string,
) => {
  try {
    insertMessageDb.run(randomUUID(), botId, message, reasoning);
  } catch (error) {
    logger.error(`Error inserting message for bot ${botId}:`, error);
  }
};

export const getMessages = (id: string): MessageOutput[] => {
  try {
    return getMessagesDb.all(id) as MessageOutput[];
  } catch (error) {
    logger.error(`Error getting messages for bot ${id}:`, error);
    return [];
  }
};
