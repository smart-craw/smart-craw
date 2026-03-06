import type { Dispatch } from "react";
import { botAction } from "../state/bot";
import type { Bot, Bots, BotAction } from "../state/bot";
import { notificationAction } from "../state/notification";
import type { Notification, NotificationAction } from "../state/notification";
import {
  messageAction,
  type MessageAction,
  type MessagesOutput,
} from "../state/message";
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

type CreateBotResponse = Bot & {
  action: (typeof Action)[keyof typeof Action];
};

type GetBotsResponse = Bots & {
  action: (typeof Action)[keyof typeof Action];
};

type GetMessagesResponse = MessagesOutput & {
  action: (typeof Action)[keyof typeof Action];
};

type MessageResponse = {
  message: string;
  id: string;
  action: (typeof Action)[keyof typeof Action];
};

/*type ApprovalResponse = Approval & {
  action: (typeof Action)[keyof typeof Action];
};*/
type ApprovalResponse = {
  toolName: string;
  id: string;
  input: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  action: (typeof Action)[keyof typeof Action];
};
type ApprovalActioned = {
  id: string;
  approved: boolean;
  action: (typeof Action)[keyof typeof Action];
};
type NotificationResponse = Notification & {
  action: (typeof Action)[keyof typeof Action];
};

export function connectWs(
  botDispatch: Dispatch<BotAction>,
  messageDispatch: Dispatch<MessageAction>,
  notificationDispatch: Dispatch<NotificationAction>,
  //approvalDispatch: Dispatch<ApprovalAction>,
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
      | ApprovalActioned
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
          approval: null,
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
        const { toolName, id, input } = rest as ApprovalResponse;
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
          approval: approved,
        });
        break;
      }
      case Action.GetMessages: {
        const { id, messages } = rest as GetMessagesResponse;
        messageDispatch({
          type: messageAction.SET,
          id,
          messages,
        });
        break;
      }
      case Action.AssistantMessage: {
        const { id, message } = rest as MessageResponse;
        console.log(message);
        messageDispatch({
          type: messageAction.ADDED,
          id,
          message,
          messageType: "assistant",
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

//TODO fix mcpConfigs
export function executeLlm(ws: WebSocket, id: string, mcpConfigs: any) {
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
