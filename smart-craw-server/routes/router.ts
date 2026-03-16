import { botExecute, createBot } from "../llm_utils/bots.ts";
import { instructLlm } from "../llm_utils/llm.ts";
import { handleLLMResponse } from "../llm_utils/responses.ts";
import { WebSocketMessageQueue } from "../llm_utils/ws.ts";
import { v4 as uuidv4 } from "uuid";
import nodeCron from "node-cron";
import type {
  ApprovalInput,
  BotIdInput,
  BotOutput,
  ConverseInput,
  CreateBotInput,
  MessageOutput,
  AssistantType,
} from "../../shared/models.ts";
import { Action, Assistant } from "../../shared/models.ts";
import { type ExecuteLLMInputServer } from "../models.ts";
import { type Query } from "@anthropic-ai/claude-agent-sdk";

export const routeCreateBot = (
  { description, name, instructions, cron }: CreateBotInput,
  sendToClient: (message: string) => void,
  insertBot: (
    id: string,
    name: string,
    description: string,
    instructions: string,
  ) => void,
  insertBotCron: (id: string, cron: string) => void,
  insertMessage: (id: string, message: string, reasoning: string) => void,
  holdQueries: Map<string, Query>,
  pendingApprovals: Map<string, (approved: boolean) => void>,
  scheduledBots: Map<string, nodeCron.ScheduledTask>,
) => {
  const bot = createBot(name, description, instructions, undefined);
  const botDefinition = bot.definition[bot.name];

  insertBot(bot.id, bot.name, botDefinition.description, botDefinition.prompt);
  if (cron) {
    insertBotCron(bot.id, cron);
    scheduledBots.set(
      bot.id,
      nodeCron.schedule(cron!, () => {
        executeBot(
          {
            id: bot.id,
            instructions: botDefinition.prompt,
            description: botDefinition.description,
            name: bot.name,
            cron,
          },
          sendToClient,
          insertMessage,
          holdQueries,
          pendingApprovals,
        );
      }),
    );
  }
  sendToClient(
    JSON.stringify({
      id: bot.id,
      name,
      description,
      instructions,
      cron,
      action: Action.CreateBot,
    }),
  );
};

export const routeRemoveBot = (
  { id }: BotIdInput,
  removeBot: (id: string) => void,
  scheduledBots: Map<string, nodeCron.ScheduledTask>,
) => {
  removeBot(id);
  scheduledBots.get(id)?.destroy(); //destroy job before removing from state
  scheduledBots.delete(id);
};

export const routeGetAllBots = (
  sendToClient: (message: string) => void,
  getBots: () => BotOutput[],
) => {
  //might want to get cron as well
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
export const executeBot = (
  botFromDb: BotOutput,
  sendToClient: (message: string) => void,
  insertMessage: (id: string, message: string, reasoning: string) => void,
  holdQueries: Map<string, Query>,
  pendingApprovals: Map<string, (approved: boolean) => void>,
) => {
  const { name, description, instructions, id } = botFromDb;
  //tell client things started
  sendToClient(
    JSON.stringify({
      action: Action.ExecutionStarted,
      id,
    }),
  );
  const bot = createBot(name, description, instructions, id);
  const query = botExecute(
    bot,
    approvalWebsocket(bot.id, sendToClient, Assistant.Bot, pendingApprovals),
    notification(sendToClient),
  );
  holdQueries.set(id, query);
  handleLLMResponse(
    query,
    id,
    assistantMessage(sendToClient),
    completeMessage(sendToClient, insertMessage),
  );
};
export const routeExecuteBot = (
  { id }: BotIdInput,
  sendToClient: (message: string) => void,
  getBot: (id: string) => BotOutput | undefined,
  insertMessage: (id: string, message: string, reasoning: string) => void,
  holdQueries: Map<string, Query>,
  pendingApprovals: Map<string, (approved: boolean) => void>,
) => {
  const botDef = getBot(id);
  if (!botDef) {
    console.error(`Execution failed: bot ${id} not found`);
    return;
  }
  executeBot(
    botDef,
    sendToClient,
    insertMessage,
    holdQueries,
    pendingApprovals,
  );
};

export const routeExecuteLlm = (
  { mcpConfigs }: ExecuteLLMInputServer,
  sendToClient: (message: string) => void,
  wsm: WebSocketMessageQueue,
  getBots: () => BotOutput[],
  holdQueries: Map<string, Query>,
  pendingApprovals: Map<string, (approved: boolean) => void>,
) => {
  const id = uuidv4();
  const bots = getBots().map(
    ({ name, description, instructions, id }: BotOutput) => {
      return createBot(name, description, instructions, id);
    },
  );
  const query = instructLlm(
    id,
    mcpConfigs, // mcpServers
    bots,
    approvalWebsocket(id, sendToClient, Assistant.Llm, pendingApprovals),
    notification(sendToClient),
    wsm,
  );
  holdQueries.set(id, query);
  handleLLMResponse(
    query,
    id,
    assistantMessage(sendToClient),
    completeLlmMessage(sendToClient),
  );
  sendToClient(
    JSON.stringify({
      id,
      action: Action.LlmInstantiate,
    }),
  );
};

export const routeConversation = (
  { message }: ConverseInput,
  wsm: WebSocketMessageQueue,
) => {
  console.log(message);
  wsm.enqueue(message);
};

export const routeApproval = (
  { approved, id }: ApprovalInput,
  sendToClient: (message: string) => void,
  assistantType: AssistantType,
  pendingApprovals: Map<string, (approved: boolean) => void>,
) => {
  console.log(pendingApprovals);
  const resolve = pendingApprovals.get(id);
  if (resolve) {
    resolve(approved);
    console.log("sending approved message");
    console.log(approved);
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
    console.warn(`No pending approval found for bot id: ${id}`);
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
};
export const routeStopBot = (
  { id }: BotIdInput,
  holdQueries: Map<string, Query>,
) => {
  const query = holdQueries.get(id);
  if (query) {
    query.close();
    holdQueries.delete(id);
  } else {
    console.warn(`No Query found for bot id: ${id}`);
  }
};

// Instead of polling global state, we issue a Promise and store its resolver
export const approvalWebsocket =
  (
    id: string,
    sendToClient: (message: string) => void,
    assistantType: AssistantType,
    pendingApprovals: Map<string, (approved: boolean) => void>,
  ) =>
  async (toolName: string, input: any) => {
    console.log("got to approval websocket");
    sendToClient(
      JSON.stringify({
        toolName,
        id,
        input,
        assistantType,
        action: Action.ApprovalRequest,
      }),
    );
    return new Promise<boolean>((resolve) => {
      pendingApprovals.set(id, resolve);
    });
  };

export const assistantMessage =
  (sendToClient: (message: string) => void) =>
  (message: string, id: string) => {
    sendToClient(
      JSON.stringify({
        message,
        id,
        action: Action.AssistantMessage,
      }),
    );
  };

export const completeMessage =
  (
    sendToClient: (message: string) => void,
    insertMessage: (id: string, message: string, reasoning: string) => void,
  ) =>
  (id: string, message: string, reasoning: string) => {
    sendToClient(
      JSON.stringify({
        id,
        action: Action.CompleteMessage,
      }),
    );
    insertMessage(id, message, reasoning);
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
