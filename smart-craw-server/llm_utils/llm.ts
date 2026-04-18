import {
  type Query,
  type McpServerConfig,
  type SDKUserMessage,
  query,
} from "@anthropic-ai/claude-agent-sdk";

import { approvalWrapper, notificationWrapper } from "./responses.ts";

function convertMcpListToObject(
  mcpServers: McpServerConfig[],
): Record<string, McpServerConfig> {
  return mcpServers.reduce<Record<string, McpServerConfig>>(
    (aggr, curr, index) => {
      return {
        ...aggr,
        [`mcp_${index}`]: curr,
      };
    },
    {},
  );
}

export function instructLlm(
  id: string,
  mcpServers: McpServerConfig[],
  approvalCb: (toolName: string, input: any) => Promise<boolean>,
  notificationCb: (message: string, type: string) => void,
  mq: AsyncIterable<SDKUserMessage>,
): Query {
  const q = query({
    prompt: mq,
    options: {
      tools: { type: "preset", preset: "claude_code" },
      mcpServers: convertMcpListToObject(mcpServers),
      allowedTools: [
        "mcp*", // All mcp
      ],
      canUseTool: approvalWrapper(approvalCb),
      sessionId: id,
      hooks: {
        Notification: [{ hooks: [notificationWrapper(notificationCb)] }],
        PostToolUseFailure: [
          {
            hooks: [notificationWrapper(notificationCb)],
          },
        ],
        PermissionRequest: [
          {
            hooks: [notificationWrapper(notificationCb)],
          },
        ],
      },
      includePartialMessages: true,
      model: process.env.MODEL || "hf.co/Qwen/Qwen3-4B-GGUF:latest",
      env: {
        ...process.env,
        ANTHROPIC_BASE_URL:
          process.env.ANTHROPIC_BASE_URL || "http://localhost:11434",
        ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN || "ollama",
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "sk-local-dummy",
        CLAUDE_CODE_ATTRIBUTION_HEADER: "0",
      },
    },
  });
  return q;
}
