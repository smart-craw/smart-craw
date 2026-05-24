export const Action = {
  CreateBot: "createbot",
  UpdateBot: "updatebot",
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

export type ConverseInput = {
  id: string;
  message: string;
};

export type WebSocketInput = {
  path: string;
  input: CreateBotInput | BotIdInput | ConverseInput;
};
