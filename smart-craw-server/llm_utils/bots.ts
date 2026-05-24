import { v4 as uuidv4 } from "uuid";
import { generateBotPath } from "../file_utils/utils.ts";
import { logger } from "../logging.ts";
import {
  Agent,
  FileStorage,
  SessionManager,
  SummarizingConversationManager,
  BeforeInvocationEvent,
  BeforeToolCallEvent,
  BeforeModelCallEvent,
  tool,
  InterruptEvent,
} from "@strands-agents/sdk";
import { OpenAIModel } from "@strands-agents/sdk/models/openai";
import { bash } from "@strands-agents/sdk/vended-tools/bash";
import { fileEditor } from "@strands-agents/sdk/vended-tools/file-editor";

type AgentDefinition = {
  description: string;
  prompt: string;
};
export type BotDefinition = {
  definition: Record<string, AgentDefinition>;
  id: string;
  name: string;
};

const dateTimeTool = tool({
  name: "current_datetime",
  description: "Get current date and time",
  callback: () => {
    return new Date().toISOString();
  },
});

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

export function createAgent(
  llmUrl: string,
  bot: BotDefinition,
  botDirectory: string,
  notificationCb: (message: string, type: string) => void,
): Agent {
  const model = new OpenAIModel({
    api: "chat",
    apiKey: "helloworld",
    contextWindowLimit: 256_000, //needed to get proactive compaction working correctly
    clientConfig: {
      baseURL: llmUrl,
    },
  });

  const session = new SessionManager({
    sessionId: bot.id,
    storage: {
      snapshot: new FileStorage(generateBotPath(botDirectory, bot.name)),
    },
  });

  const tools = [bash, fileEditor, dateTimeTool];

  // Create an agent with tools
  const agent = new Agent({
    systemPrompt: bot.definition[bot.name].prompt,
    sessionManager: session,
    model,
    printer: false,
    tools,
    id: bot.name,
    conversationManager: new SummarizingConversationManager({
      summaryRatio: 0.5,
      preserveRecentMessages: 10,
      proactiveCompression: true, //compress before hitting context limit error
    }),
  });
  agent.addHook(BeforeInvocationEvent, (event) => {
    logger.debug(JSON.stringify(event, null, 2));
  });

  agent.addHook(BeforeModelCallEvent, (event) => {
    logger.info(JSON.stringify(event, null, 2));
  });
  agent.addHook(BeforeToolCallEvent, (event) => {
    logger.info(JSON.stringify(event, null, 2));
  });

  agent.addHook(InterruptEvent, (event) => {
    const messageText = JSON.stringify(event, null, 2);
    logger.info(messageText);
    notificationCb(messageText, "interrupt");
  });
  return agent;

  /*const queryResult = query({
    prompt: bot.definition[bot.name].prompt,
    options: {
      cwd: generateBotPath(botDirectory, bot.name), //folder path is directory, with own "memory"
      tools: { type: "preset", preset: "claude_code" },
      canUseTool: approvalWrapper(approvalCb),
      hooks: {
        Notification: [{ hooks: [notificationWrapper(notificationCb)] }],
        PostToolUseFailure: [
          {
            hooks: [notificationWrapper(notificationCb)],
          },
        ],
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
        CLAUDE_CODE_ATTRIBUTION_HEADER: "0",
      },
    },
  });
  return queryResult;*/
}
