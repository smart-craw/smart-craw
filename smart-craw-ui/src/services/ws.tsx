import type { Dispatch } from "react";
import { botAction } from "../state/bot";
import type {
  Bot,
  Bots,
  BotAction,
  ApprovalRequestedFromServer,
  ApprovalActioned,
} from "../state/bot";
import { notificationAction } from "../state/notification";
import type { Notification, NotificationAction } from "../state/notification";
import {
  messageAction,
  type MessageAction,
  type MessagesFromServer,
  type MessagePayload,
} from "../state/message";
import type { McpConfigs } from "./types";

const Action = {
  CreateBot: "createbot",
  GetBots: "getbots",
  ApprovalRequest: "approvalrequest",
  ApprovalActioned: "approvalactioned",
  AssistantMessage: "assistantmessage",
  CompleteMessage: "completemessage",
  Notification: "notification",
  GetMessages: "getmessages",
} as const;

type ActionType = (typeof Action)[keyof typeof Action];

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

type ApprovalResponse = ApprovalRequestedFromServer & {
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
): WebSocket {
  const url = new URL(`/ws`, window.location.href);
  //handles https and wss too since both end in s
  url.protocol = url.protocol.replace("http", "ws");
  const ws = new WebSocket(url);
  ws.onopen = () => {
    console.log("connected");
    getBots(ws);
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
        const { toolName, id, input } = rest as ApprovalRequestedFromServer;
        console.log("Got approval request");
        botDispatch({
          type: botAction.APPROVAL,
          id,
          approval: { toolName, input },
        });
        break;
      }
      case Action.ApprovalActioned: {
        const { id, approved } = rest as ApprovalActioned;
        console.log("Got approval action");
        botDispatch({
          type: botAction.ACTIONED,
          id,
          approved,
        });
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
        console.log(message);
        messageDispatch({
          type: messageAction.ADDED,
          id,
          message,
          //messageType: "assistant",
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
      case Action.Notification: {
        const { notificationType, message } = rest as Notification;
        console.log("got notification");
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

export function executeLlm(ws: WebSocket, id: string, mcpConfigs: McpConfigs) {
  ws.send(
    JSON.stringify({
      path: "/llm/execute",
      input: { id, mcpConfigs },
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

export function sendApproval(ws: WebSocket, id: string, toolName: string) {
  ws.send(
    JSON.stringify({
      path: "/tool/approval",
      input: { approved: true, toolName, id },
    }),
  );
}
