import path from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { logger } from "../logging.ts";
import { createAgent } from "./converse.ts";
import { Agent } from "@strands-agents/sdk";
import { mkdir } from "node:fs/promises";
import { handleLLMResponse } from "./response.ts";

export type SessionManager = ReturnType<typeof createSessionManager>;

// There is a corresponding [sessionId] in the workingDirectory
// Strands handles session memory
// This sessionManager handles keeping the workingDirectory in sync
export const createSessionManager = (
  llmUrl: string,
  sessionMemoryDirectory: string, //for automatic storage of conversations
  workingDirectory: string, //where actual work happens
  mcpServerUrls: string[],
  onComplete: (fullMessage: string, isError: boolean) => void,
) => {
  let agent: Agent | undefined;
  const localAgentId = "agent";
  let currentSessionId: string = randomUUID();
  const queue: string[] = [];
  let running = false;

  // while in theory no messages will arrive while
  // previous response is still running, this ensures that
  // if they do that they wait until the llm is ready
  // before executing
  const queueMessage = (message: string) => {
    queue.push(message);
    if (!running) {
      drain();
    }
  };

  const drain = async () => {
    if (agent) {
      running = true;
      // careful, queue can be mutated via queueMessage while this loop is running
      // this is intentional, but worth noting
      while (queue.length > 0) {
        const msg = queue.shift()!;
        await handleLLMResponse(agent.stream(msg), onComplete);
      }
      running = false;
    }
  };
  const getSessionId = () => {
    return currentSessionId;
  };

  const setSessionId = async (sessionId: string) => {
    currentSessionId = sessionId;
    await startSession(sessionId);
    return currentSessionId;
  };

  const newSession = async () => {
    currentSessionId = randomUUID();
    await startSession(currentSessionId);
    return currentSessionId;
  };

  const cancelMessage = () => {
    if (agent !== undefined) {
      agent.cancel();
    }
  };

  const startSession = async (sessionId: string) => {
    const sessionWorkingDirectory = path.join(workingDirectory, sessionId);
    //does not error if directory already exists
    await mkdir(sessionWorkingDirectory, { recursive: true });
    cancelMessage();
    agent = await createAgent(
      llmUrl,
      sessionId,
      sessionWorkingDirectory,
      sessionMemoryDirectory,
      localAgentId,
      mcpServerUrls,
    );
    return agent;
  };

  const getSessionFolders = async (directory: string) => {
    const files = await readdir(directory);
    const fileStats = await Promise.all(
      files.map((v) => Promise.all([v, stat(path.join(directory, v))])),
    );
    return fileStats
      .filter(([_, v]) => v.isDirectory())
      .map(([folderName, stats]) => ({
        fsCreatedAt: stats.birthtime,
        sessionId: folderName,
      }));
  };

  // this ONLY gets from memory filesystem.
  // workingDirectory may have a different set of folders
  const getSessions = async () => {
    const fileStats = await getSessionFolders(sessionMemoryDirectory);
    const sessions = await Promise.all(
      fileStats.map(async ({ sessionId }) => {
        //see https://strandsagents.com/docs/user-guide/concepts/agents/session-management/#file-storage-structure
        const latestSessionInfo = path.join(
          sessionMemoryDirectory,
          sessionId,
          "scopes",
          "agent",
          localAgentId,
          "snapshots",
          "snapshot_latest.json",
        );
        try {
          const { createdAt, data } = JSON.parse(
            await readFile(latestSessionInfo, "utf-8"),
          );
          return {
            createdAt,
            summary: data.messages[0].content[0]["text"],
            sessionId,
          };
        } catch (err) {
          const error = err as Error;
          logger.error(`Error! ${error.name}: ${error.message}`);
          return null;
        }
      }),
    );
    return sessions.filter((v) => v !== null);
  };

  const loadLastSessionOrCreateInitial = async () => {
    const sessionIds = await getSessionFolders(workingDirectory);
    sessionIds.sort(
      (a, b) => b.fsCreatedAt.getTime() - a.fsCreatedAt.getTime(),
    );
    logger.debug(`Sessions: ${JSON.stringify(sessionIds, null, 2)}`);
    if (sessionIds.length > 0) {
      currentSessionId = sessionIds[0].sessionId;
    }
    await startSession(currentSessionId);
  };

  return {
    queueMessage,
    getSessionId,
    setSessionId,
    newSession,
    getSessions,
    cancelMessage,
    loadLastSessionOrCreateInitial,
    //exported for testing only
    getSessionFolders,
  };
};
