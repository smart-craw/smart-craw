import {
  AgentDefinition,
  Query,
  HookCallback,
  McpServerConfig,
  NotificationHookInput,
  PermissionResult,
  query,
} from "@anthropic-ai/claude-agent-sdk";
import { type BotDefinition } from "./bots";
import { WebSocketMessageQueue } from "./ws";

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
const notificationWrapper = (
  notificationCb: (message: string) => undefined,
) => {
  const notificationHandler: HookCallback = async (
    input,
    toolUseID,
    { signal },
  ) => {
    const notification = input as NotificationHookInput;
    notificationCb(notification.message);
    return {};
  };
  return notificationHandler;
};
const approvalWrapper = (
  approvalCb: (toolName: string, input: any) => Promise<boolean>,
) => {
  return async function customApprovalCallback(
    toolName: string,
    input: any,
  ): Promise<PermissionResult> {
    //console.log(`⏸️ Agent paused. Claude wants to use: ${toolName}`);
    //console.log(`Input parameters: ${JSON.stringify(input)}`);

    // 2. Integrate with your app's state/UI here.
    // Example: This function could send a WebSocket event to your frontend
    // and await a Promise that resolves when the user clicks "Approve" or "Deny".
    const isApproved = await approvalCb(toolName, input);

    return isApproved
      ? { behavior: "allow" }
      : { behavior: "deny", message: "Tool use denied" };
  };
};

export function instructLlm(
  mcpServers: McpServerConfig[],
  bots: BotDefinition[],
  approvalCb: (toolName: string, input: any) => Promise<boolean>,
  notificationCb: (message: string) => undefined,
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
