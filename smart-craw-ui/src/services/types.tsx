export const McpTransport = {
  SSE: "sse",
  HTTP: "http",
} as const;
type McpTransportType = (typeof McpTransport)[keyof typeof McpTransport];
type McpConfig =
  | {
      command: string;
      args: string[];
      env?: Record<string, string>;
    }
  | {
      type: McpTransportType; //sse or http
      url: string;
      headers?: Record<string, string>;
    };
export type McpConfigs = Record<string, McpConfig>;
