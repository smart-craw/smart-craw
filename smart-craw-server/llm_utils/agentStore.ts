import nodeCron from "node-cron";
import { type BotOutput, type AgentWithSchedule } from "../models.ts";
import { LLM_ID, notification, runAgent } from "../routes/router.ts";
import { type StreamUtils } from "../routes/utils.ts";
import { createAgent, createBot } from "./bots.ts";

export const setAgents = (
  llmUrl: string,
  getBots: () => BotOutput[],
  streamUtils: StreamUtils,
  botDirectory: string,
  sessionStorageDirectory: string,
  insertMessage: (id: string, message: string, reasoning: string) => void,
) => {
  const holdAgents = new Map<string, AgentWithSchedule>(
    getBots().map((bot: BotOutput) => {
      const botDefinition = createBot(
        bot.name,
        bot.description,
        bot.instructions,
        bot.id,
      );
      const agent = createAgent(
        llmUrl,
        botDefinition,
        botDirectory,
        sessionStorageDirectory,
        notification(streamUtils.sendToClient),
      );
      const cronTask = bot.cron
        ? nodeCron.schedule(bot.cron, () => {
            runAgent(agent, streamUtils, insertMessage);
          })
        : undefined;
      return [bot.id, { agent, cronTask }];
    }),
  );
  const llmDefinition = createBot(
    "llm",
    "Simple request/response llm for experimenting",
    "", //no instructions since these are given "per request"
    LLM_ID,
  );
  holdAgents.set(LLM_ID, {
    agent: createAgent(
      llmUrl,
      llmDefinition,
      process.cwd(),
      sessionStorageDirectory,
      notification(streamUtils.sendToClient),
    ),
  });
  return holdAgents;
};
