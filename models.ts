import { McpServerConfig } from "@anthropic-ai/claude-agent-sdk";

export type CreateBotInput = {
  description: string;
  instructions: string;
  name: string;
  id?: string;
};
export type BotIdInput = {
  id: string;
};

export type ApprovalInput = {
  approved: boolean;
  toolName: string;
  id: string;
};

export type ExecuteLLMInput = {
  id: string;
  mcpConfigs: McpServerConfig[];
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
    | ConverseInput; //plus more in the future
};
