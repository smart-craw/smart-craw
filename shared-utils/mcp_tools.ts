import { tool, McpClient, McpTransport } from "@strands-agents/sdk";
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

export async function getAllMcpTools(mcpServerUrls: string[]) {
  const mcpCodeClients = mcpServerUrls.map(
    (url) =>
      new McpClient({
        transport: new StreamableHTTPClientTransport(
          new URL(url),
        ) as McpTransport,
      }),
  );

  const mcpTools = (
    await Promise.all(mcpCodeClients.map((v) => v.listTools()))
  ).flat();
  return mcpTools;
}
