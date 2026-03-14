import { botExecute, createBot } from "../llm_utils/bots.ts";
import { instructLlm } from "../llm_utils/llm.ts";
import { handleLLMResponse } from "../llm_utils/responses.ts";
import { WebSocketMessageQueue } from "../llm_utils/ws.ts";
import { v4 as uuidv4 } from "uuid";
import WebSocket from "ws";
import type {
  ApprovalInput,
  BotIdInput,
  BotOutput,
  ConverseInput,
  CreateBotInput,
  MessageOutput,
  ActionType,
  AssistantType,
} from "../../shared/models.ts";
import { Action, Assistant } from "../../shared/models.ts";
import { type ExecuteLLMInputServer } from "../models.ts";
import { type Query } from "@anthropic-ai/claude-agent-sdk";



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
  getBot: (id: string) => CreateBotInput | undefined,
  insertMessage: (id: string, message: string, reasoning: string) => void,
  holdQueries: Map<string, Query>,
  pendingApprovals: Map<string, (approved: boolean) => void>,
) => {
  const botDef = getBot(id);
  if (!botDef) {
    console.error(`Execution failed: bot ${id} not found`);
    return;
  }
  const { name, description, instructions } = botDef;
  const bot = createBot(name, description, instructions, id);
  const query = botExecute(
    bot,
    approvalWebsocket(bot.id, ws, Assistant.Bot, pendingApprovals),
    notification(ws),
  );
  holdQueries.set(id, query);
  handleLLMResponse(
    query,
    id,
    assistantMessage(ws),
    completeMessage(ws, insertMessage),
  );
};

export const routeExecuteLlm = (
  { mcpConfigs }: ExecuteLLMInputServer,
  ws: WebSocket,
  wsm: WebSocketMessageQueue,
  getBots: () => BotOutput[],
  insertMessage: (id: string, message: string, reasoning: string) => void,
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
    approvalWebsocket(id, ws, Assistant.Llm, pendingApprovals),
    notification(ws),
    wsm,
  );
  holdQueries.set(id, query);
  handleLLMResponse(query, id, assistantMessage(ws), completeLlmMessage(ws));
  ws.send(
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

const routeApproval = (
  { approved, id }: ApprovalInput,
  ws: WebSocket,
  assistantType: AssistantType,
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
  ws: WebSocket,
  pendingApprovals: Map<string, (approved: boolean) => void>,
) => {
  routeApproval(input, ws, Assistant.Bot, pendingApprovals);
};
export const routeLlmApproval = (
  input: ApprovalInput,
  ws: WebSocket,
  pendingApprovals: Map<string, (approved: boolean) => void>,
) => {
  routeApproval(input, ws, Assistant.Llm, pendingApprovals);
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
    assistantType: AssistantType,
    pendingApprovals: Map<string, (approved: boolean) => void>,
  ) =>
  async (toolName: string, input: any) => {
    console.log("got to approval websocket");
    ws.send(
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
  (ws: WebSocket) => (message: string, id: string) => {
    ws.send(
      JSON.stringify({
        message,
        id,
        action: Action.AssistantMessage,
      }),
    );
  };

export const completeMessage =
  (
    ws: WebSocket,
    insertMessage: (id: string, message: string, reasoning: string) => void,
  ) =>
  (id: string, message: string, reasoning: string) => {
    ws.send(
      JSON.stringify({
        id,
        action: Action.CompleteMessage,
      }),
    );
    insertMessage(id, message, reasoning);
  };

export const completeLlmMessage =
  (ws: WebSocket) => (id: string, message: string, reasoning: string) => {
    ws.send(
      JSON.stringify({
        id,
        message,
        reasoning,
        action: Action.CompleteLlmMessage,
      }),
    );
  };
export const notification =
  (ws: WebSocket) => (message: string, notificationType: string) => {
    ws.send(
      JSON.stringify({
        message,
        notificationType,
        action: Action.Notification,
      }),
    );
  };
