import {
  type AgentDefinition,
  type Query,
  query,
} from "@anthropic-ai/claude-agent-sdk";
import { v4 as uuidv4 } from "uuid";
import { approvalWrapper, notificationWrapper } from "./responses.ts";
/*import {
  autoApproveWriteMemory,
  createPath,
  writeOwnKnowledge,
} from "./memory.ts";*/

export type BotDefinition = {
  definition: Record<string, AgentDefinition>;
  id: string;
  name: string;
};

//model and tools are inhereted from parent
export function createBot(
  name: string,
  description: string,
  instructions: string,
  id: string | undefined,
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
  approvalCb: (toolName: string, input: any) => Promise<boolean>,
  notificationCb: (message: string, type: string) => void,
): Query {
  //const path = createPath(bot.id, bot.name);
  const queryResult = query({
    prompt: bot.definition[bot.name].prompt,
    options: {
      cwd: bot.name, //folder path is directory, with own "memory"
      //claude code automatically
      /*systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: writeOwnKnowledge(path),
        },*/
      tools: { type: "preset", preset: "claude_code" },
      canUseTool: approvalWrapper(approvalCb),
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
  return queryResult;
}
