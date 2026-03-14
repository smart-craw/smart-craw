import type { Dispatch } from "react";
import { botAction } from "../state/bot";

import type { Bot, Bots, BotAction } from "../state/bot";
import { notificationAction } from "../state/notification";
import type { Notification, NotificationAction } from "../state/notification";
import {
  messageAction,
  type MessageAction,
  type MessagesFromServer,
  type MessagePayload,
} from "../state/message";
import type {
  McpConfig,
  ApprovalActioned,
  ApprovalRequestedFromServer,
} from "./types";
import { llmAction, type LlmAction } from "../state/llm";

const Action = {
  CreateBot: "createbot",
  GetBots: "getbots",
  ApprovalRequest: "approvalrequest",
  ApprovalActioned: "approvalactioned",
  AssistantMessage: "assistantmessage",
  CompleteMessage: "completemessage",
  CompleteLlmMessage: "completellmmessage",
  Notification: "notification",
  GetMessages: "getmessages",
  LlmInstantiate: "llminstantiate",
} as const;

type ActionType = (typeof Action)[keyof typeof Action];
const Assistant = {
  Llm: "llm",
  Bot: "bot",
};
type AssistantType = (typeof Assistant)[keyof typeof Assistant];
type CreateBotResponse = Bot & {
  action: ActionType;
};

type GetBotsResponse = Bots & {
  action: ActionType;
};

type GetMessagesResponse = MessagesFromServer & {
  action: ActionType;
};

type MessageResponse = MessagePayload & {
  action: ActionType;
};

type MessageLlmResponse = {
  id: string;
  message: string;
  reasoning: string;
  action: ActionType;
};

type ApprovalResponse = ApprovalRequestedFromServer & {
  assistantType: AssistantType;
  action: ActionType;
};
type ApprovalActionedResponse = ApprovalActioned & {
  action: ActionType;
};
type NotificationResponse = Notification & {
  action: ActionType;
};

export function connectWs(
  botDispatch: Dispatch<BotAction>,
  messageDispatch: Dispatch<MessageAction>,
  notificationDispatch: Dispatch<NotificationAction>,
  llmDispatch: Dispatch<LlmAction>,
): WebSocket {
  const url = new URL(`/ws`, window.location.href);
  //handles https and wss too since both end in s
  url.protocol = url.protocol.replace("http", "ws");
  const ws = new WebSocket(url);
  ws.onopen = () => {
    console.log("connected");
    getBots(ws);
    //TODO, add ability to create mcpConfigs
    executeLlm(ws, []);
  };
  ws.onmessage = (event) => {
    const { action, ...rest } = JSON.parse(event.data) as
      | CreateBotResponse
      | GetBotsResponse
      | ApprovalResponse
      | ApprovalActionedResponse
      | NotificationResponse
      | MessageResponse
      | GetMessagesResponse;
    switch (action) {
      case Action.CreateBot: {
        const { name, id, description, instructions } = rest as Bot;
        botDispatch({
          type: botAction.ADDED,
          name,
          id,
          description,
          instructions,
          approval: undefined,
        });
        break;
      }
      case Action.GetBots: {
        const { bots } = rest as Bots;
        botDispatch({
          type: botAction.SET,
          bots,
        });
        break;
      }
      case Action.ApprovalRequest: {
        const { toolName, id, input, assistantType } =
          rest as ApprovalRequestedFromServer & {
            assistantType: AssistantType;
          };
        console.log("Got approval request");
        console.log(assistantType);
        switch (assistantType) {
          case Assistant.Llm: {
            llmDispatch({
              type: llmAction.APPROVAL,
              id,
              toolName,
              input,
            });
            break;
          }
          case Assistant.Bot: {
            botDispatch({
              type: botAction.APPROVAL,
              id,
              toolName,
              input,
            });
            break;
          }
        }

        break;
      }
      case Action.ApprovalActioned: {
        const { id, approved, assistantType } = rest as ApprovalActioned & {
          assistantType: AssistantType;
        };
        console.log("Got approval action");
        console.log(assistantType);
        switch (assistantType) {
          case Assistant.Llm: {
            llmDispatch({
              type: llmAction.ACTIONED,
              id,
              approved,
            });
            break;
          }
          case Assistant.Bot: {
            botDispatch({
              type: botAction.ACTIONED,
              id,
              approved,
            });
            break;
          }
        }
        break;
      }
      case Action.GetMessages: {
        const { id, messages } = rest as MessagesFromServer;
        messageDispatch({
          type: messageAction.SET,
          id,
          messages,
        });
        break;
      }
      case Action.AssistantMessage: {
        const { id, message } = rest as MessagePayload;
        messageDispatch({
          type: messageAction.ADDED,
          id,
          message,
        });
        break;
      }
      case Action.CompleteMessage: {
        const { id } = rest as MessageResponse;
        messageDispatch({
          type: messageAction.FINISHED,
          id,
        });
        botDispatch({
          type: botAction.FINISHED,
          id,
        });
        break;
      }
      case Action.CompleteLlmMessage: {
        const { id, message } = rest as MessageLlmResponse;
        llmDispatch({
          type: llmAction.FINISHED,
          result: message,
          id,
        });
        break;
      }
      case Action.LlmInstantiate: {
        const { id } = rest as MessageResponse;
        console.log("instantiated llm", id);
        llmDispatch({
          type: llmAction.SET,
          id,
          instructions: "",
          isExecuting: false,
          result: "",
        });
        break;
      }
      case Action.Notification: {
        console.log("got notification");
        console.log(rest);
        const { notificationType, message } = rest as Notification;
        //console.log("got notification");
        console.log(message);
        notificationDispatch({
          type: notificationAction.ADDED,
          notificationType,
          message,
        });
        break;
      }
    }
  };
  return ws;
}

export function createBot(
  ws: WebSocket,
  name: string,
  description: string,
  instructions: string,
) {
  ws.send(
    JSON.stringify({
      path: "/bot/create",
      input: { description, instructions, name },
    }),
  );
}

export function removeBot(ws: WebSocket, id: string) {
  ws.send(
    JSON.stringify({
      path: "/bot/remove",
      input: { id },
    }),
  );
}

export function executeBot(ws: WebSocket, id: string) {
  ws.send(
    JSON.stringify({
      path: "/bot/execute",
      input: { id },
    }),
  );
}

export function stopBot(ws: WebSocket, id: string) {
  ws.send(
    JSON.stringify({
      path: "/bot/stop",
      input: { id },
    }),
  );
}

export function getBots(ws: WebSocket) {
  ws.send(
    JSON.stringify({
      path: "/bot/all",
    }),
  );
}

export function getMessages(ws: WebSocket, id: string) {
  ws.send(
    JSON.stringify({
      input: { id },
      path: "/bot/messages",
    }),
  );
}

export function executeLlm(ws: WebSocket, mcpConfigs: McpConfig[]) {
  ws.send(
    JSON.stringify({
      path: "/llm/instantiate",
      input: { mcpConfigs },
    }),
  );
}

export function converseLlm(ws: WebSocket, id: string, message: string) {
  ws.send(
    JSON.stringify({
      path: "/llm/converse",
      input: { id, message },
    }),
  );
}

export function sendBotApproval(ws: WebSocket, id: string, toolName: string) {
  ws.send(
    JSON.stringify({
      path: "/bot/approval",
      input: { approved: true, toolName, id },
    }),
  );
}

export function sendLlmApproval(ws: WebSocket, id: string, toolName: string) {
  ws.send(
    JSON.stringify({
      path: "/llm/approval",
      input: { approved: true, toolName, id },
    }),
  );
}
