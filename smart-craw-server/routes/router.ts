import { botExecute, createBot } from "../llm_utils/bots.ts";
import { instructLlm } from "../llm_utils/llm.ts";
import { handleLLMResponse } from "../llm_utils/responses.ts";
import { WebSocketMessageQueue } from "../llm_utils/ws.ts";
import WebSocket from "ws";
import type {
  ApprovalInput,
  BotIdInput,
  BotOutput,
  ConverseInput,
  CreateBotInput,
  ExecuteLLMInput,
  MessageOutput,
} from "../models.ts";
import { type Query } from "@anthropic-ai/claude-agent-sdk";

const Action = {
  CreateBot: "createbot",
  ApprovalRequest: "approvalrequest",
  ApprovalActioned: "approvalactioned",
  AssistantMessage: "assistantmessage",
  CompleteMessage: "completemessage",
  Notification: "notification",
  GetBots: "getbots",
  GetMessages: "getmessages",
} as const;

export const routeCreateBot = (
  { description, name, instructions }: CreateBotInput,
  ws: WebSocket,
  insertBot: (
    id: string,
    name: string,
    description: string,
    instructions: string,
  ) => void,
) => {
  const bot = createBot(name, description, instructions, undefined);
  const botDefinition = bot.definition[bot.name];

  insertBot(bot.id, bot.name, botDefinition.description, botDefinition.prompt);
  ws.send(
    JSON.stringify({
      id: bot.id,
      name,
      description,
      instructions,
      action: Action.CreateBot,
    }),
  );
  //return ;
};

export const routeRemoveBot = (
  { id }: BotIdInput,
  removeBot: (id: string) => void,
) => {
  removeBot(id);
};

export const routeGetAllBots = (ws: WebSocket, getBots: () => BotOutput[]) => {
  //might want to get cron as well
  const bots = getBots();
  ws.send(
    JSON.stringify({
      bots,
      action: Action.GetBots,
    }),
  );
};
export const routeGetMessages = (
  { id }: BotIdInput,
  ws: WebSocket,
  getMessages: (id: string) => MessageOutput[],
) => {
  const messages = getMessages(id);
  ws.send(
    JSON.stringify({
      id,
      messages,
      action: Action.GetMessages,
    }),
  );
};
export const routeExecuteBot = (
  { id }: BotIdInput,
  ws: WebSocket,
  getBot: (id: string) => CreateBotInput,
  insertMessage: (id: string, message: string, reasoning: string) => void,
  holdQueries: Map<string, Query>,
  pendingApprovals: Map<string, (approved: boolean) => void>,
) => {
  const { name, description, instructions } = getBot(id);
  const bot = createBot(name, description, instructions, id);
  const query = botExecute(
    bot,
    approvalWebsocket(bot.id, ws, pendingApprovals),
    notification(ws),
  );
  holdQueries.set(id, query);
  handleLLMResponse(
    query,
    id,
    assistantMessage(ws),
    completeMessage(ws),
    insertMessage,
  );
};

export const routeExecuteLlm = (
  { id, mcpConfigs }: ExecuteLLMInput,
  ws: WebSocket,
  wsm: WebSocketMessageQueue,
  getBots: () => BotOutput[],
  insertMessage: (id: string, message: string, reasoning: string) => void,
  holdQueries: Map<string, Query>,
  pendingApprovals: Map<string, (approved: boolean) => void>,
) => {
  const bots = getBots().map(
    ({ name, description, instructions, id }: BotOutput) => {
      return createBot(name, description, instructions, id);
    },
  );
  const query = instructLlm(
    mcpConfigs, // mcpServers
    bots,
    approvalWebsocket(id, ws, pendingApprovals),
    notification(ws),
    wsm,
  );
  holdQueries.set(id, query);
  handleLLMResponse(
    query,
    id,
    assistantMessage(ws),
    completeMessage(ws),
    insertMessage,
  );
};

export const routeConversation = (
  { message }: ConverseInput,
  wsm: WebSocketMessageQueue,
) => {
  wsm.enqueue(message);
};

export const routeApproval = (
  { approved, id }: ApprovalInput,
  ws: WebSocket,
  pendingApprovals: Map<string, (approved: boolean) => void>,
) => {
  console.log(pendingApprovals);
  const resolve = pendingApprovals.get(id);
  if (resolve) {
    resolve(approved);
    console.log("sending approved message");
    console.log(approved);
    ws.send(
      JSON.stringify({
        id,
        approved,
        action: Action.ApprovalActioned,
      }),
    );
    pendingApprovals.delete(id);
  } else {
    console.warn(`No pending approval found for bot id: ${id}`);
  }
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
    ws: WebSocket,
    pendingApprovals: Map<string, (approved: boolean) => void>,
  ) =>
  async (toolName: string, input: any) => {
    console.log("got to approval websocket");
    ws.send(
      JSON.stringify({
        toolName,
        id,
        input,
        action: Action.ApprovalRequest,
      }),
    );
    return new Promise<boolean>((resolve) => {
      pendingApprovals.set(id, resolve);
    });
  };

export const assistantMessage =
  (ws: WebSocket) => (message: string, id: string) => {
    ws.send(
      JSON.stringify({
        message,
        id,
        action: Action.AssistantMessage,
      }),
    );
  };

export const completeMessage = (ws: WebSocket) => (id: string) => {
  ws.send(
    JSON.stringify({
      id,
      action: Action.CompleteMessage,
    }),
  );
};
export const notification =
  (ws: WebSocket) => (message: string, type: string) => {
    ws.send(
      JSON.stringify({
        message,
        type,
        action: Action.Notification,
      }),
    );
  };
