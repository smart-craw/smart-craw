import { useAppStore } from "../state/store";
import type { Bot, Notification } from "../state/store";
import {
  Action,
  type ActionType,
  Assistant,
  type AssistantType,
  type ApprovalActioned,
  type ApprovalRequestedFromServer,
  type McpConfig,
  type MessageOutput,
} from "../../../shared/models.ts";

type CreateBotResponse = Bot & {
  action: ActionType;
};

type GetBotsResponse = {
  bots: Bot[];
  action: ActionType;
};

type MessagesFromServer = {
  id: string;
  messages: MessageOutput[];
};

type GetMessagesResponse = MessagesFromServer & {
  action: ActionType;
};

type MessagePayload = {
  id: string;
  message: string;
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

type ExecutionResponse = {
  id: string;
  action: ActionType;
};

export function connectWs(): WebSocket {
  console.log("this is the url", window.location.href);
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
    const store = useAppStore.getState();
    const { action, ...rest } = JSON.parse(event.data) as
      | CreateBotResponse
      | GetBotsResponse
      | ApprovalResponse
      | ApprovalActionedResponse
      | NotificationResponse
      | MessageResponse
      | GetMessagesResponse
      | ExecutionResponse;
    switch (action) {
      case Action.CreateBot: {
        const { name, id, description, instructions } = rest as Bot;
        store.addBot({
          name,
          id,
          description,
          instructions,
          isExecuting: false,
        });
        break;
      }
      case Action.GetBots: {
        const { bots } = rest as GetBotsResponse;
        store.setBots(bots);
        break;
      }
      case Action.ApprovalRequest: {
        const { toolName, id, input, assistantType } = rest as ApprovalResponse;
        console.log("Got approval request", assistantType);
        switch (assistantType) {
          case Assistant.Llm: {
            store.setLlmApproval(id, toolName, input);
            break;
          }
          case Assistant.Bot: {
            store.setBotApproval(id, toolName, input);
            break;
          }
        }
        break;
      }
      case Action.ApprovalActioned: {
        const { id, approved, assistantType } = rest as ApprovalActioned & {
          assistantType: AssistantType;
        };
        console.log("Got approval action", assistantType);
        switch (assistantType) {
          case Assistant.Llm: {
            store.actionLlmApproval(approved);
            break;
          }
          case Assistant.Bot: {
            store.actionBotApproval(id, approved);
            break;
          }
        }
        break;
      }
      case Action.GetMessages: {
        const { id, messages } = rest as MessagesFromServer;
        store.setMessages(id, messages);
        break;
      }
      case Action.AssistantMessage: {
        const { id, message } = rest as MessagePayload;
        store.addMessage(id, message);
        break;
      }
      case Action.CompleteMessage: {
        const { id } = rest as MessageResponse;
        store.finishMessage(id);
        store.finishBot(id);
        break;
      }
      case Action.ExecutionStarted: {
        console.log("execution started");
        const { id } = rest as ExecutionResponse;
        store.startBot(id);
        break;
      }
      case Action.CompleteLlmMessage: {
        const { message } = rest as MessageLlmResponse;
        store.finishLlm(message);
        break;
      }
      case Action.LlmInstantiate: {
        const { id } = rest as MessageResponse;
        console.log("instantiated llm", id);
        store.setLlm({
          id,
          instructions: "",
          isExecuting: false,
          result: "",
        });
        break;
      }
      case Action.Notification: {
        const { notificationType, message } = rest as Notification;
        console.log(message);
        store.setNotification({ notificationType, message });
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
  cron?: string,
) {
  ws.send(
    JSON.stringify({
      path: "/bot/create",
      input: { description, instructions, name, cron },
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
