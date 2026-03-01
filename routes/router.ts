import { getBot, insertBot } from "../db_utils/use_db";
import { botExecute, createBot } from "../llm_utils/bots";
import { instructLlm } from "../llm_utils/llm";
import { handleLLMResponse } from "../llm_utils/responses";
import { WebSocketMessageQueue } from "../llm_utils/ws";
import { ApprovalInput, BotIdInput, CreateBotInput } from "../models";
import { GlobalBotState } from "../state";
const Action = {
  CreateBot: "createbot",
  ExecuteBot: "executebot",
  Approval: "approval",
  AssistantMessage: "assistantmessage",
  ResultMessage: "resultmessage",
  Notification: "notification",
} as const;
export const routeCreateBot = (
  { description, name, instructions }: CreateBotInput,
  botState: GlobalBotState,
  ws: WebSocket,
) => {
  const bot = createBot(name, description, instructions, null);
  const botDefinition = bot.definition[bot.name];
  botState[bot.id] = { approval: null };
  insertBot.run(
    bot.id,
    botDefinition.description,
    bot.name,
    botDefinition.prompt,
  );
  ws.send(
    JSON.stringify({
      id: bot.id,
      name: bot.name,
      action: Action.CreateBot,
    }),
  );
  //return ;
};
export const routeExecuteBot = (
  { id }: BotIdInput,
  botState: GlobalBotState,
  ws: WebSocket,
) => {
  const { name, description, instructions } = getBot.get(id) as CreateBotInput;
  const bot = createBot(name, description, instructions, id);
  botState[bot.id] = { approval: null };
  const query = botExecute(
    bot,
    approvalWebsocket(bot.id, botState, ws),
    notification(ws),
  );
  handleLLMResponse(query, id, assistantMessage(ws), resultMessage(ws));
};

export const routeExecuteLlm = (
  { id }: BotIdInput,
  botState: GlobalBotState,
  ws: WebSocket,
  wsm: WebSocketMessageQueue,
) => {
  const query = instructLlm(
    bot,
    approvalWebsocket(bot.id, botState, ws),
    notification(ws),
    wsm,
  );
  handleLLMResponse(query, id, assistantMessage(ws), resultMessage(ws));
};

export const routeApproval = (
  { approved, id }: ApprovalInput,
  botState: GlobalBotState,
) => {
  botState[id] = { approval: approved };
};

// This is gross.  I have global mutable state
// that I then poll to see if it is updated
export const approvalWebsocket =
  (id: string, botState: GlobalBotState, ws: WebSocket) =>
  async (toolName: string, input: any) => {
    ws.send(
      JSON.stringify({
        toolName,
        input,
        action: Action.Approval,
      }),
    );
    return new Promise<boolean>((res) => {
      let intervalId = setInterval(() => {
        const { approval } = botState[id];
        if (approval !== null) {
          clearInterval(intervalId);
          //reset botState approval
          botState[id] = { approval: null };
          res(approval);
        }
      }, 50);
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
