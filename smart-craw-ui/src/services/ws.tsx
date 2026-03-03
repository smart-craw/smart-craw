import type { Dispatch } from "react";
//import type { Approval, ApprovalAction } from "../state/approval";
import type { Bot, Bots, BotAction } from "../state/bot";
import type { Notification, NotificationAction } from "../state/notification";
import type { MessageAction } from "../state/message";
const Action = {
  CreateBot: "createbot",
  GetBots: "getbots",
  Approval: "approval",
  AssistantMessage: "assistantmessage",
  CompleteMessage: "completemessage",
  Notification: "notification",
} as const;

type CreateBotResponse = Bot & {
  action: (typeof Action)[keyof typeof Action];
};

type GetBotsResponse = Bots & {
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
    ws.send(
      JSON.stringify({
        path: "/bot/all",
      }),
    );
  };
  ws.onmessage = (event) => {
    const { action, ...rest } = JSON.parse(event.data) as
      | CreateBotResponse
      | GetBotsResponse
      | ApprovalResponse
      | NotificationResponse
      | MessageResponse;
    switch (action) {
      case Action.CreateBot: {
        const { name, id, description, instructions } = rest as Bot;
        botDispatch({
          type: "added",
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
          type: "set",
          bots,
        });
        break;
      }
      case Action.Approval: {
        const { toolName, id, input } = rest as ApprovalResponse;
        botDispatch({ type: "approval", id, approval: { toolName, input } });
        break;
      }
      case Action.AssistantMessage: {
        const { id, message } = rest as MessageResponse;
        console.log(message);
        messageDispatch({
          type: "added",
          id,
          message,
          messageType: "assistant",
        });
        break;
      }
      case Action.CompleteMessage: {
        const { id, message } = rest as MessageResponse;
        messageDispatch({
          type: "completed",
          id,
          message,
          messageType: "result",
        });
        break;
      }
      case Action.Notification: {
        const { notificationType, message } = rest as Notification;
        notificationDispatch({ type: "added", notificationType, message });
        break;
      }
    }
  };
  return ws;
}
