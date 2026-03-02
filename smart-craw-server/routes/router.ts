import { getBot, insertBot, getBots } from "../db_utils/use_db.ts";
import { botExecute, createBot } from "../llm_utils/bots.ts";
import { instructLlm } from "../llm_utils/llm.ts";
import { handleLLMResponse } from "../llm_utils/responses.ts";
import { WebSocketMessageQueue } from "../llm_utils/ws.ts";
import WebSocket from "ws";
import type {
  ApprovalInput,
  BotIdInput,
  ConverseInput,
  CreateBotInput,
  ExecuteLLMInput,
} from "../models.ts";
const Action = {
  CreateBot: "createbot",
  Approval: "approval",
  AssistantMessage: "assistantmessage",
  ResultMessage: "resultmessage",
  Notification: "notification",
  GetBots: "getbots",
} as const;

//this is mutable "global" state.  Be careful
export const pendingApprovals = new Map<string, (approved: boolean) => void>();
export const routeCreateBot = (
  { description, name, instructions }: CreateBotInput,
  ws: WebSocket,
) => {
  const bot = createBot(name, description, instructions, undefined);
  const botDefinition = bot.definition[bot.name];
  insertBot.run(
    bot.id,
    botDefinition.description,
    bot.name,
    botDefinition.prompt,
  );
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

export const routeGetAllBots = (ws: WebSocket) => {
  //might want to get cron as well
  const bots = getBots.all().map((v) => {
    const { name, description, instructions, id } = v as CreateBotInput;
    return { name, description, instructions, id };
  });
  ws.send(
    JSON.stringify({
      bots,
      action: Action.GetBots,
    }),
  );
};
export const routeExecuteBot = ({ id }: BotIdInput, ws: WebSocket) => {
  const { name, description, instructions } = getBot.get(id) as CreateBotInput;
  const bot = createBot(name, description, instructions, id);
  const query = botExecute(
    bot,
    approvalWebsocket(bot.id, ws),
    notification(ws),
  );
  handleLLMResponse(query, id, assistantMessage(ws), resultMessage(ws));
};

export const routeExecuteLlm = (
  { id, mcpConfigs }: ExecuteLLMInput,
  ws: WebSocket,
  wsm: WebSocketMessageQueue,
) => {
  const bots = getBots.all().map((v) => {
    const { name, description, instructions, id } = v as CreateBotInput;
    return createBot(name, description, instructions, id);
  });
  const query = instructLlm(
    mcpConfigs, // mcpServers
    bots,
    approvalWebsocket(id, ws),
    notification(ws),
    wsm,
  );
  handleLLMResponse(query, id, assistantMessage(ws), resultMessage(ws));
};

export const routeConversation = (
  { message }: ConverseInput,
  wsm: WebSocketMessageQueue,
) => {
  wsm.enqueue(message);
};

export const routeApproval = ({ approved, id }: ApprovalInput) => {
  const resolve = pendingApprovals.get(id);
  if (resolve) {
    resolve(approved);
    pendingApprovals.delete(id);
  } else {
    console.warn(`No pending approval found for bot id: ${id}`);
  }
};

// Instead of polling global state, we issue a Promise and store its resolver
export const approvalWebsocket =
  (id: string, ws: WebSocket) => async (toolName: string, input: any) => {
    ws.send(
      JSON.stringify({
        toolName,
        id,
        input,
        action: Action.Approval,
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

export const resultMessage =
  (ws: WebSocket) => (message: string, id: string) => {
    ws.send(
      JSON.stringify({
        message,
        id,
        action: Action.ResultMessage,
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
