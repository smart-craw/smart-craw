import nodeCron from "node-cron";
import { type BotOutput, type AgentWithSchedule } from "../models.ts";
import { LLM_ID, notification, runAgent } from "../routes/router.ts";
import { type StreamUtils } from "../routes/utils.ts";
import { createAgent } from "./bots.ts";

export const setAgents = (
  llmUrl: string,
  getBots: () => BotOutput[],
  streamUtils: StreamUtils,
  botDirectory: string,
  sessionStorageDirectory: string,
  insertMessage: (id: string, message: string, reasoning: string) => void,
) => {
  const holdAgents = new Map<string, AgentWithSchedule>(
    getBots().map(({ name, instructions, id, cron }: BotOutput) => {
      const agent = createAgent(
        llmUrl,
        id,
        name,
        botDirectory,
        sessionStorageDirectory,
        notification(streamUtils.sendToClient),
      );
      const cronTask = cron
        ? nodeCron.schedule(cron, () => {
            runAgent(agent, streamUtils, insertMessage, instructions);
          })
        : undefined;
      return [id, { agent, cronTask, instructions }];
    }),
  );
  holdAgents.set(LLM_ID, {
    agent: createAgent(
      llmUrl,
      LLM_ID,
      "llm",
      process.cwd(),
      sessionStorageDirectory,
      notification(streamUtils.sendToClient),
    ),
    instructions: "", //no instructions since these are given "per request"
  });
  return holdAgents;
};
