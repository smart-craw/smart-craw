import { type McpServerConfig } from "@anthropic-ai/claude-agent-sdk";
export * from "../shared/models.ts";

export type ExecuteLLMInputServer = {
  mcpConfigs: McpServerConfig[];
};

export type WebSocketInputServer = {
  path: string;
  input: any; // Allow the server router to narrow types
};
