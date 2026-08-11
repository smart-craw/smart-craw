import {
  Agent,
  SessionManager,
  SummarizingConversationManager,
  BeforeInvocationEvent,
  BeforeToolCallEvent,
  BeforeModelCallEvent,
} from "@strands-agents/sdk";
import { OpenAIModel } from "@strands-agents/sdk/models/openai";
import { logger } from "../logging.ts";
import { getSystemPrompt } from "./prompt.ts";

import { bash } from "@strands-agents/sdk/vended-tools/bash";
import { fileEditor } from "@strands-agents/sdk/vended-tools/file-editor";
import { LocalFileStorage } from "@strands-agents/sdk/storage";
import {
  dateTimeTool,
  generateNoRuntimeInstructions,
  getAllMcps,
  refreshMcps,
} from "../../shared-utils/mcp_tools.ts";

import { blockProgramExecution } from "../../shared-utils/utils.ts";

export async function createAgent(
  llmUrl: string,
  sessionId: string,
  sessionDirectory: string, //where agent should store its files
  sessionStorageLocation: string, //equivalent to ~/.claude in claude code
  agentId: string,
  mcpServerUrls: string[],
) {
  const model = new OpenAIModel({
    api: "chat",
    apiKey: "helloworld",
    contextWindowLimit: 256_000, //needed to get proactive compaction working correctly
    clientConfig: {
      baseURL: llmUrl,
    },
  });

  const session = new SessionManager({
    sessionId,
    storage: new LocalFileStorage(sessionStorageLocation),
  });
  const { mcpTools, mcpToolsToClient } = await getAllMcps(mcpServerUrls);
  const mcpToolNames = mcpTools.map((v) => v.name);
  const bashInstructions = generateNoRuntimeInstructions(mcpToolNames);
  const tools = [bash, fileEditor, dateTimeTool, ...mcpTools];

  // Create an agent with tools
  const agent = new Agent({
    systemPrompt: getSystemPrompt(sessionDirectory),
    sessionManager: session,
    model,
    printer: false,
    tools,
    id: agentId,
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
  return agent;
}
