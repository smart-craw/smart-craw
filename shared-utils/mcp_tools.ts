import { tool, McpClient, BeforeToolCallEvent } from "@strands-agents/sdk";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

export function generateNoRuntimeInstructions(tools: string[]) {
  const toolNameHint =
    tools.length > 0 ? `Use one of ${tools.join(", ")} - ` : "";
  return toolNameHint + "Do not invoke language runtimes directly via bash.";
}

export const dateTimeTool = tool({
  name: "current_datetime",
  description: "Get current date and time",
  callback: () => {
    return new Date().toISOString();
  },
});

export async function getAllMcps(mcpServerUrls: string[]) {
  const mcpClients = mcpServerUrls.map(
    (url) =>
      new McpClient({
        transport: new StreamableHTTPClientTransport(new URL(url)),
      }),
  );

  const mcpToolsWithClient = await Promise.all(
    mcpClients.map(async (v) => ({ client: v, tools: await v.listTools() })),
  );

  const mcpTools = mcpToolsWithClient.map((v) => v.tools).flat();

  const mcpToolsToClient = new Map<string, McpClient>();
  mcpToolsWithClient.forEach(({ client, tools }) => {
    tools.forEach((tool) => mcpToolsToClient.set(tool.name, client));
  });
  return { mcpTools, mcpToolsToClient };
}

export async function refreshMcps(
  clients: Map<string, McpClient>,
  event: BeforeToolCallEvent,
) {
  const client = clients.get(event.toolUse.name);
  //strands will automatically call 'connect' on the next tool invocation
  if (client) await client.disconnect();
}
