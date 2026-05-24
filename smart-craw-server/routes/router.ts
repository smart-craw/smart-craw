import { createAgent, createBot } from "../llm_utils/bots.ts";
import { handleLLMResponse } from "../llm_utils/responses.ts";
import nodeCron from "node-cron";
import type {
  BotIdInput,
  BotOutput,
  CreateBotInput,
  MessageOutput,
} from "../../shared/models.ts";
import { Action } from "../../shared/models.ts";
import { type AgentWithSchedule } from "../models.ts";
import { logger } from "../logging.ts";
import { type StreamUtils } from "./utils.ts";
import { Agent } from "@strands-agents/sdk";

export const routeCreateBot = (
  { id, description, name, instructions, cron }: CreateBotInput,
  llmUrl: string,
  botDirectory: string,
  manageBotFolder: ({ id, name }: Pick<CreateBotInput, "id" | "name">) => void,
  insertBot: (
    id: string,
    name: string,
    description: string,
    instructions: string,
  ) => void,
  insertBotCron: (id: string, cron: string) => void,
  streamUtils: StreamUtils,
  insertMessage: (id: string, message: string, reasoning: string) => void,
  holdAgents: Map<string, AgentWithSchedule>,
) => {
  const newBot = id === undefined;
  const bot = createBot(name, description, instructions, id);
  const botDefinition = bot.definition[bot.name];
  logger.info(newBot ? `Creating new bot ${bot.id}` : `Update bot ${bot.id}`);
  manageBotFolder({ id, name });
  insertBot(bot.id, bot.name, botDefinition.description, botDefinition.prompt);
  const agent = createAgent(
    llmUrl,
    bot,
    botDirectory,
    notification(streamUtils.sendToClient),
  );

  if (cron) {
    logger.info(`Scheduling bot ${bot.id}`);
    insertBotCron(bot.id, cron);
  }
  const cronTask = cron
    ? nodeCron.schedule(cron, () => {
        runAgent(agent, streamUtils, insertMessage);
      })
    : undefined;
  holdAgents.set(bot.id, { agent, cronTask });
  streamUtils.sendToClient(
    JSON.stringify({
      id: bot.id,
      name,
      description,
      instructions,
      cron,
      action: newBot ? Action.CreateBot : Action.UpdateBot,
    }),
  );
};

export const routeRemoveBot = (
  { id }: BotIdInput,
  removeBot: (id: string) => void,
  holdAgents: Map<string, AgentWithSchedule>,
) => {
  removeBot(id);
  const agentWithSchedule = holdAgents.get(id);
  if (agentWithSchedule) {
    const { cronTask } = agentWithSchedule;
    cronTask?.destroy(); //destroy job before removing from state
    holdAgents.delete(id);
  }
};

export const routeGetAllBots = (
  sendToClient: (message: string) => void,
  getBots: () => BotOutput[],
) => {
  const bots = getBots();
  sendToClient(
    JSON.stringify({
      bots,
      action: Action.GetBots,
    }),
  );
};
export const routeGetMessages = (
  { id }: BotIdInput,
  sendToClient: (message: string) => void,
  getMessages: (id: string) => MessageOutput[],
) => {
  const messages = getMessages(id);
  sendToClient(
    JSON.stringify({
      id,
      messages,
      action: Action.GetMessages,
    }),
  );
};

export const runAgent = (
  agent: Agent,
  streamUtils: StreamUtils,
  insertMessage: (id: string, message: string, reasoning: string) => void,
  prompt: string = "",
) => {
  streamUtils.sendToClient(
    JSON.stringify({
      action: Action.ExecutionStarted,
      id: agent.id,
    }),
  );
  const agentStream = agent.stream(prompt);
  handleLLMResponse(
    agentStream,
    agent.id,
    streamUtils,
    completeMessage(streamUtils.sendToClient, insertMessage),
  );
};

export const routeExecuteBot = (
  { id }: BotIdInput,
  streamUtils: StreamUtils,
  insertMessage: (id: string, message: string, reasoning: string) => void,
  holdAgents: Map<string, AgentWithSchedule>,
) => {
  const agentWithSchedule = holdAgents.get(id);
  if (!agentWithSchedule) {
    logger.error(`Execution failed: bot ${id} not found`);
    return;
  }
  runAgent(agentWithSchedule.agent, streamUtils, insertMessage);
};
export const LLM_ID = "llm";
export const routeInstantiateLlm = (streamUtils: StreamUtils) => {
  streamUtils.sendToClient(
    JSON.stringify({
      id: LLM_ID,
      action: Action.LlmInstantiate,
    }),
  );
};
export const routeExecuteLlm = (
  prompt: string,
  streamUtils: StreamUtils,
  holdAgents: Map<string, AgentWithSchedule>,
) => {
  const agentWithSchedule = holdAgents.get(LLM_ID);
  if (!agentWithSchedule) {
    logger.error(`Execution failed: LLM not found`);
    return;
  }
  const { agent } = agentWithSchedule;
  const agentStream = agent.stream(prompt);
  handleLLMResponse(
    agentStream,
    agent.id,
    streamUtils,
    completeLlmMessage(streamUtils.sendToClient),
  );

  streamUtils.sendToClient(
    JSON.stringify({
      id: agent.id,
      action: Action.LlmInstantiate,
    }),
  );
};

/*export const routeConversation = (
  { message }: ConverseInput,
  wsm: WebSocketMessageQueue,
) => {
  wsm.enqueue(message);
};

export const routeApproval = (
  { approved, id }: ApprovalInput,
  sendToClient: (message: string) => void,
  assistantType: AssistantType,
  pendingApprovals: Map<string, (approved: boolean) => void>,
) => {
  const resolve = pendingApprovals.get(id);
  if (resolve) {
    resolve(approved);
    sendToClient(
      JSON.stringify({
        id,
        approved,
        assistantType,
        action: Action.ApprovalActioned,
      }),
    );
    pendingApprovals.delete(id);
  } else {
    logger.warn(`No pending approval found for bot id: ${id}`);
  }
};
export const routeBotApproval = (
  input: ApprovalInput,
  sendToClient: (message: string) => void,
  pendingApprovals: Map<string, (approved: boolean) => void>,
) => {
  routeApproval(input, sendToClient, Assistant.Bot, pendingApprovals);
};
export const routeLlmApproval = (
  input: ApprovalInput,
  sendToClient: (message: string) => void,
  pendingApprovals: Map<string, (approved: boolean) => void>,
) => {
  routeApproval(input, sendToClient, Assistant.Llm, pendingApprovals);
};*/

export const routeStopBot = (
  { id }: BotIdInput,
  holdAgents: Map<string, AgentWithSchedule>,
) => {
  const agentWithSchedule = holdAgents.get(id);
  if (agentWithSchedule) {
    agentWithSchedule.agent.cancel();
  } else {
    logger.warn(`No Query found for bot id: ${id}`);
  }
};

export const completeMessage =
  (
    sendToClient: (message: string) => void,
    insertMessage: (id: string, message: string, reasoning: string) => void,
  ) =>
  (id: string, message: string, reasoning: string) => {
    //message can either be the actual message or a literal "error"
    sendToClient(
      JSON.stringify({
        id,
        message,
        reasoning,
        action: Action.CompleteMessage,
      }),
    );
    if (message !== "error") {
      insertMessage(id, message, reasoning);
    }
  };

export const completeLlmMessage =
  (sendToClient: (message: string) => void) =>
  (id: string, message: string, reasoning: string) => {
    sendToClient(
      JSON.stringify({
        id,
        message,
        reasoning,
        action: Action.CompleteLlmMessage,
      }),
    );
  };
export const notification =
  (sendToClient: (message: string) => void) =>
  (message: string, notificationType: string) => {
    sendToClient(
      JSON.stringify({
        message,
        notificationType,
        action: Action.Notification,
      }),
    );
  };
