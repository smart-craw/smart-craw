import {
  SDKSession,
  unstable_v2_createSession,
  createSdkMcpServer,
  tool,
  type McpSdkServerConfigWithInstance,
  type SDKMessage,
  type AgentDefinition,
  type Query,
  query,
} from "@anthropic-ai/claude-agent-sdk";
import { v4 as uuidv4 } from "uuid";

export type BotDefinition = {
  definition: Record<string, AgentDefinition>;
  id: string;
  name: string;
};
///How do I want this to be configured?  Do I let people create bots from a UI?
// How would I handle authentication to remote calls?
//Do I just provide a pre-created set of bots?  And make sure people don't mix and match them dumbly?
// Instead of each having its own mcp, have each be its own "subagent" (with only Claude tools available)
//

//model and tools are inhereted from parent
export function createBot(
  name: string,
  description: string,
  instructions: string,
  id: string | null,
): BotDefinition {
  return {
    name,
    definition: {
      [name]: {
        description,
        prompt: instructions,
      },
    },
    id: id || uuidv4(),
  };
}

//should bots have mcp servers?
export function botExecute(
  bot: BotDefinition,
  //cb: (msg: string) => undefined,
): Query {
  const queryResult = query({
    prompt: bot.definition[bot.name].prompt,
    options: {
      /*mcpServers: {
        "claude-code-docs": {
          type: "http",
          url: "https://code.claude.com/docs/mcp",
        },
      },*/
      //allowedTools: ["mcp__claude-code-docs__*"],
      tools: { type: "preset", preset: "claude_code" },
    },
  });
  return queryResult;
}
