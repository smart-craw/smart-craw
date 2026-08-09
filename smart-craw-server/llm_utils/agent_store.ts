import nodeCron from "node-cron";
import { type BotOutput, type AgentWithSchedule } from "../models.ts";
import { LLM_ID, LLM_NAME, notification, runAgent } from "../routes/router.ts";
import { type StreamUtils } from "../routes/utils.ts";
import { createAgent } from "./bots.ts";

export async function setAgents(
  llmUrl: string,
  getBots: () => BotOutput[],
  streamUtils: StreamUtils,
  botDirectory: string,
  sessionStorageDirectory: string,
  mcpServerUrls: string[],
  insertMessage: (id: string, message: string, reasoning: string) => void,
) {
  const botAgents: Promise<[string, AgentWithSchedule][]> = Promise.all(
    getBots().map(async ({ name, instructions, id, cron }: BotOutput) => {
      const agent = await createAgent(
        llmUrl,
        id,
        name,
        botDirectory,
        sessionStorageDirectory,
        mcpServerUrls,
        notification(streamUtils.sendToClient),
      );
      const cronTask = cron
        ? nodeCron.schedule(cron, () => {
            runAgent(agent, streamUtils, insertMessage, instructions);
          })
        : undefined;
      return [id, { agent, cronTask, instructions } as AgentWithSchedule];
    }),
  );
  //creates an "llm agent" in the same folder as the bots, but with the name "llm"
  const llmAgent: Promise<[string, AgentWithSchedule]> = createAgent(
    llmUrl,
    LLM_ID,
    LLM_NAME,
    botDirectory,
    sessionStorageDirectory,
    mcpServerUrls,
    notification(streamUtils.sendToClient),
  ).then((agent) => [
    LLM_ID,
    {
      agent,
      instructions: "", //no instructions since these are given "per request"
    } as AgentWithSchedule,
  ]);
  const [botEntries, llmEntry] = await Promise.all([botAgents, llmAgent]);
  const agents: [string, AgentWithSchedule][] = [...botEntries, llmEntry];
  const holdAgents = new Map<string, AgentWithSchedule>(agents);
  return holdAgents;
}
