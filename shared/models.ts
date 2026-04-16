export const Action = {
  CreateBot: "createbot",
  UpdateBot: "updatebot",
  ApprovalRequest: "approvalrequest",
  ApprovalActioned: "approvalactioned",
  AssistantMessage: "assistantmessage",
  CompleteMessage: "completemessage",
  CompleteLlmMessage: "completellmmessage",
  Notification: "notification",
  GetBots: "getbots",
  GetMessages: "getmessages",
  LlmInstantiate: "llminstantiate",
  ExecutionStarted: "executionstarted",
  ToolMessage: "toolmessage",
} as const;

export type ActionType = (typeof Action)[keyof typeof Action];

export const Assistant = {
  Llm: "llm",
  Bot: "bot",
};

export type AssistantType = (typeof Assistant)[keyof typeof Assistant];

export type CreateBotInput = {
  description: string;
  instructions: string;
  name: string;
  id?: string;
  cron?: string;
};

export type BotOutput = {
  description: string;
  instructions: string;
  name: string;
  id: string;
  cron?: string;
};

export type MessageOutput = {
  id: string;
  message: string;
  reasoning: string;
  timestamp: string;
};

export type BotIdInput = {
  id: string;
};

export type ApprovalInput = {
  approved: boolean;
  toolName: string;
  id: string;
};

export const McpTransport = {
  SSE: "sse",
  HTTP: "http",
} as const;

export type McpTransportType = (typeof McpTransport)[keyof typeof McpTransport];

export type McpConfig =
  | {
      command: string;
      args: string[];
      env?: Record<string, string>;
    }
  | {
      type: McpTransportType; //sse or http
      url: string;
      headers?: Record<string, string>;
    };

export type ExecuteLLMInput = {
  mcpConfigs: McpConfig[];
};

export type ConverseInput = {
  id: string;
  message: string;
};

export type WebSocketInput = {
  path: string;
  input:
    | CreateBotInput
    | BotIdInput
    | ApprovalInput
    | ExecuteLLMInput
    | ConverseInput;
};

export type Approval = {
  toolName: string;
  input: any;
};

export type ApprovalRequestedFromServer = Approval & {
  id: string;
};

export type ApprovalActioned = {
  id: string;
  approved: boolean;
};
