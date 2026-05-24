import nodeCron from "node-cron";
import { type BotOutput, type AgentWithSchedule } from "../models.ts";
import { LLM_ID, notification, runAgent } from "../routes/router.ts";
import { type StreamUtils } from "../routes/utils.ts";
import { Agent } from "@strands-agents/sdk";
import { createAgent, createBot } from "./bots.ts";

export const setAgents = (
  llmUrl: string,
  getBots: () => BotOutput[],
  streamUtils: StreamUtils,
  botDirectory: string,
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
      notification(streamUtils.sendToClient),
    ),
  });
  return holdAgents;
};
/*
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
      botPath,
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
    notification(streamUtils.sendToClient),
  ),
});
*/
/*
export const startScheduler = (
  //botDirectory: string,
  getBots: () => BotOutput[],
  streamUtils: StreamUtils,
  insertMessage: (id: string, message: string, reasoning: string) => void,
  holdAgents: Map<string, Agent>,
  //pendingApprovals: Map<string, (approved: boolean) => void>,
) => {
  return getBots()
    .filter((v) => v.cron !== null)
    .map((bot: BotOutput) => {
      return {
        id: bot.id,
        job: nodeCron.schedule(bot.cron!, () => {
          const agent = holdAgents.get(bot.id);
          if (agent) runAgent(agent, streamUtils, insertMessage);

        }),
      };
    })
    .reduce((aggr, curr) => {
      return { ...aggr, [curr.id]: curr.job };
    }, {});
};
*/
