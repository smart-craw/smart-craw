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

/*export function createBot(
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
  }*/

export function createAgent(
  llmUrl: string,
  //bot: BotDefinition,
  botId: string,
  botName: string,
  botDirectory: string,
  sessionStorageDirectory: string,
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
    sessionId: botId,
    storage: {
      snapshot: new FileStorage(sessionStorageDirectory),
    },
  });

  const tools = [bash, fileEditor, dateTimeTool];
  const botPath = generateBotPath(botDirectory, botName);
  // Create an agent with tools
  const agent = new Agent({
    systemPrompt: `Perform your actions in this directory: ${botPath}.  Your directions will come via messages that may often repeat.  Don't worry if they repeat, simply follow the directions.`,
    sessionManager: session,
    model,
    printer: false,
    tools,
    id: botId, //bot id and session id are the same
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
}
