import {
  type AgentDefinition,
  type Query,
  type McpServerConfig,
  query,
} from "@anthropic-ai/claude-agent-sdk";
import { type BotDefinition } from "./bots.ts";
import { WebSocketMessageQueue } from "./ws.ts";
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

function convertAgentListToObject(
  bots: BotDefinition[],
): Record<string, AgentDefinition> {
  return bots.reduce<Record<string, AgentDefinition>>((aggr, curr, index) => {
    return {
      ...aggr,
      ...curr.definition,
    };
  }, {});
}

export function instructLlm(
  mcpServers: McpServerConfig[],
  bots: BotDefinition[],
  approvalCb: (toolName: string, input: any) => Promise<boolean>,
  notificationCb: (message: string, type: string) => void,
  mq: WebSocketMessageQueue,
): Query {
  const q = query({
    prompt: mq,
    options: {
      tools: { type: "preset", preset: "claude_code" },
      mcpServers: convertMcpListToObject(mcpServers),
      agents: convertAgentListToObject(bots),
      permissionMode: "acceptEdits", //enables mcp servers to be viewed, but make sure this ONLY runs in docker
      canUseTool: approvalWrapper(approvalCb),
      hooks: {
        Notification: [{ hooks: [notificationWrapper(notificationCb)] }],
      },
    },
  });
  return q;
}
