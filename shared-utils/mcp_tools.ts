import {
  tool,
  McpClient,
  type JSONSchema,
  type JSONValue,
} from "@strands-agents/sdk";
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

function makeMcpClient(url: string) {
  return new McpClient({
    transport: new StreamableHTTPClientTransport(new URL(url)),
  });
}

function asToolArgs(input: unknown): { [x: string]: unknown } | undefined {
  if (input === undefined) return undefined;
  if (typeof input !== "object" || input === null) {
    throw new Error(`Expected object arguments, got ${typeof input}`);
  }
  return input as { [x: string]: unknown };
}
async function createMcpTool(mcpServerUrl: string) {
  const bootstrap = makeMcpClient(mcpServerUrl);
  const mcpTools = await bootstrap.listTools();
  await bootstrap.disconnect();

  return mcpTools.map((mcpTool) =>
    tool({
      name: mcpTool.name,
      description: mcpTool.description,
      inputSchema: mcpTool.toolSpec.inputSchema as JSONSchema, // JSON schema straight from MCP
      callback: async (input) => {
        // fresh client + transport, every single call
        const client = makeMcpClient(mcpServerUrl);
        await client.connect();
        const result = await client.client.callTool({
          name: mcpTool.name,
          arguments: asToolArgs(input),
        });
        await client.disconnect();
        return result as unknown as JSONValue;
      },
    }),
  );
}

export async function createAllMcpTools(mcpServerUrls: string[]) {
  return (await Promise.all(mcpServerUrls.map(createMcpTool))).flat();
}
