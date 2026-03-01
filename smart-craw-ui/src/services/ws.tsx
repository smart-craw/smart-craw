import type { Dispatch } from "react";
import type { Approval, ApprovalAction } from "../state/approval";
import type { Bot, BotAction } from "../state/bot";
import type { Notification, NotificationAction } from "../state/notification";
import type { MessageAction } from "../state/message";
const Action = {
  CreateBot: "createbot",
  Approval: "approval",
  AssistantMessage: "assistantmessage",
  ResultMessage: "resultmessage",
  Notification: "notification",
} as const;

type CreateBotResponse = Bot & {
  action: (typeof Action)[keyof typeof Action];
};

type MessageResponse = {
  message: string;
  id: string;
  action: (typeof Action)[keyof typeof Action];
};

type ApprovalResponse = Approval & {
  action: (typeof Action)[keyof typeof Action];
};

type NotificationResponse = Notification & {
  action: (typeof Action)[keyof typeof Action];
};

export function connectWs(
  botDispatch: Dispatch<BotAction>,
  messageDispatch: Dispatch<MessageAction>,
  notificationDispatch: Dispatch<NotificationAction>,
  approvalDispatch: Dispatch<ApprovalAction>,
): WebSocket {
  const url = new URL(`/`, window.location.href);
  //handles https and wss too since both end in s
  url.protocol = url.protocol.replace("http", "ws");
  const ws = new WebSocket(url);
  ws.onopen = () => {
    console.log("connected");
  };
  ws.onmessage = (event) => {
    const { action, ...rest } = JSON.parse(event.data) as
      | CreateBotResponse
      | ApprovalResponse
      | NotificationResponse
      | MessageResponse;
    switch (action) {
      case Action.CreateBot: {
        const { name, id } = rest as Bot;
        botDispatch({ type: "added", name, id });
        break;
      }
      case Action.Approval: {
        const { toolName, id, input } = rest as Approval;
        approvalDispatch({ type: "added", toolName, id, input });
        break;
      }
      case Action.AssistantMessage: {
        const { id, message } = rest as MessageResponse;
        messageDispatch({
          type: "added",
          id,
          message,
          messageType: "assistant",
        });
        break;
      }
      case Action.ResultMessage: {
        const { id, message } = rest as MessageResponse;
        messageDispatch({
          type: "added",
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
