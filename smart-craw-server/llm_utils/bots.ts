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
import { AnthropicModel } from "@strands-agents/sdk/models/anthropic";
import { LocalFileStorage } from "@strands-agents/sdk/storage";
import { bash } from "@strands-agents/sdk/vended-tools/bash";
import { fileEditor } from "@strands-agents/sdk/vended-tools/file-editor";
import {
  dateTimeTool,
  generateNoRuntimeInstructions,
  createAllMcpTools,
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
  //anthropic reasoning is fuly supported
  const model = new AnthropicModel({
    apiKey: "helloworld",
    modelId: "local-model",
    maxTokens: 1028,
    contextWindowLimit: 128_000, //needed to get proactive compaction working correctly
    clientConfig: { baseURL: llmUrl },
  });

  const session = new SessionManager({
    sessionId: botId,
    storage: new LocalFileStorage(sessionStorageDirectory),
  });
  const mcpTools = await createAllMcpTools(mcpServerUrls);
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
  agent.addHook(BeforeToolCallEvent, (event) => {
    blockProgramExecution(event, bashInstructions);
    logger.info(JSON.stringify(event, null, 2));
  });
  agent.addHook(InterruptEvent, (event) => {
    const messageText = JSON.stringify(event, null, 2);
    logger.info(messageText);
    notificationCb(messageText, "interrupt");
  });
  return agent;
}
