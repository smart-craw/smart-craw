import {
  type AgentDefinition,
  type Query,
  type McpServerConfig,
  query,
} from "@anthropic-ai/claude-agent-sdk";

import { type BotDefinition } from "./bots.ts";
import { WebSocketMessageQueue } from "./ws.ts";
import { approvalWrapper, notificationWrapper } from "./responses.ts";
/*import {
  autoApproveWriteMemory,
  createPath,
  writeOwnKnowledge,
} from "./memory.ts";*/
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

function convertAgentListToObject(
  bots: BotDefinition[],
): Record<string, AgentDefinition> {
  return bots.reduce<Record<string, AgentDefinition>>((aggr, curr) => {
    return {
      ...aggr,
      ...curr.definition,
    };
  }, {});
}

export function instructLlm(
  id: string,
  mcpServers: McpServerConfig[],
  bots: BotDefinition[],
  approvalCb: (toolName: string, input: any) => Promise<boolean>,
  notificationCb: (message: string, type: string) => void,
  mq: WebSocketMessageQueue,
): Query {
  //const path = createPath(id, "llm");
  const q = query({
    prompt: mq,
    options: {
      tools: { type: "preset", preset: "claude_code" },
      mcpServers: convertMcpListToObject(mcpServers),
      allowedTools: [
        "mcp*", // All mcp
      ],
      agents: convertAgentListToObject(bots), //is this needed??
      canUseTool: approvalWrapper(approvalCb),
      sessionId: id,
      /*systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: writeOwnKnowledge(path),
        },*/
      hooks: {
        Notification: [{ hooks: [notificationWrapper(notificationCb)] }],
        PostToolUseFailure: [
          {
            hooks: [notificationWrapper(notificationCb)],
          },
        ],
        /*PreToolUse: [
          { matcher: "Write|Edit", hooks: [autoApproveWriteMemory(path)] },
          ],*/
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
      },
    },
  });
  return q;
}
