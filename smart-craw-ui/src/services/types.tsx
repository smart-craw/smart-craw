export const McpTransport = {
  SSE: "sse",
  HTTP: "http",
} as const;
type McpTransportType = (typeof McpTransport)[keyof typeof McpTransport];
export type McpConfig =
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
//export type McpConfigs = Record<string, McpConfig>;

export type Approval = {
  toolName: string;
  input: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};
export type ApprovalRequestedFromServer = Approval & {
  id: string;
};

// this is from server OR from client ("optimistically" updated client side)
export type ApprovalActioned = {
  id: string;
  approved: boolean;
};
