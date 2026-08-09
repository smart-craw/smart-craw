import { tool, McpClient } from "@strands-agents/sdk";
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
  const mcpTools = (
    await Promise.all(mcpClients.map((v) => v.listTools()))
  ).flat();
  return { mcpTools, mcpClients };
}
export function refreshMcps(clients: McpClient[]) {
  clients.forEach((mcp) => {
    if (mcp.connectionState !== "connected") {
      mcp.connect();
    }
  });
}
