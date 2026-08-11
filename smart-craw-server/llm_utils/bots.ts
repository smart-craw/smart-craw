import { generateBotPath } from "../file_utils/utils.ts";
import { logger } from "../logging.ts";
import {
  Agent,
  SessionManager,
  SummarizingConversationManager,
  BeforeInvocationEvent,
  BeforeToolCallEvent,
  BeforeModelCallEvent,
  InterruptEvent,
} from "@strands-agents/sdk";
import { OpenAIModel } from "@strands-agents/sdk/models/openai";
import { LocalFileStorage } from "@strands-agents/sdk/storage";
import { bash } from "@strands-agents/sdk/vended-tools/bash";
import { fileEditor } from "@strands-agents/sdk/vended-tools/file-editor";
import {
  dateTimeTool,
  generateNoRuntimeInstructions,
  getAllMcps,
  refreshMcps,
} from "../../shared-utils/mcp_tools.ts";

import { blockProgramExecution } from "../../shared-utils/utils.ts";

export async function createAgent(
  llmUrl: string,
  botId: string,
  botName: string,
  botDirectory: string,
  sessionStorageDirectory: string,
  mcpServerUrls: string[],
  notificationCb: (message: string, type: string) => void,
): Promise<Agent> {
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
    storage: new LocalFileStorage(sessionStorageDirectory),
  });
  const { mcpTools, mcpToolsToClient } = await getAllMcps(mcpServerUrls);
  const mcpToolNames = mcpTools.map((v) => v.name);
  const bashInstructions = generateNoRuntimeInstructions(mcpToolNames);
  const tools = [bash, fileEditor, dateTimeTool, ...mcpTools];
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
  agent.addHook(BeforeToolCallEvent, async (event) => {
    blockProgramExecution(event, bashInstructions);
    await refreshMcps(mcpToolsToClient, event);
    logger.info(JSON.stringify(event, null, 2));
  });
  agent.addHook(InterruptEvent, (event) => {
    const messageText = JSON.stringify(event, null, 2);
    logger.info(messageText);
    notificationCb(messageText, "interrupt");
  });
  return agent;
}
