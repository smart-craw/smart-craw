async function loadSignalBot() {
  if (process.env.MOCK) {
    const module = await import("./signal/bot.mock.ts");
    return module;
  } else {
    const module = await import("./signal/bot.ts");
    return module;
  }
}
const { SignalBot } = await loadSignalBot();
import "dotenv/config";
import { parseMessage } from "./llm/response.ts";
import { logger } from "./logging.ts";
import { createSessionManager } from "./llm/session.ts";

import {
  startThinkToken,
  endThinkToken,
  workingDirectory,
  sessionDirectory,
  mcpUrls,
  openAiEndpoint,
} from "../shared-utils/env.ts";

const adminNumber = `+1${process.env.SIGNAL_USER_ADMIN_NUMBER}`;
const signalUrl = process.env.SIGNAL_REST_ENDPOINT || "http://localhost:9001";

const commandPrefix = "/";

logger.info(
  `Start think token: ${startThinkToken}, End think Token ${endThinkToken}`,
);
logger.info(`API endpoint: ${process.env.OPEN_API_COMPATIBLE_ENDPOINT}`);
logger.info(`MCP endpoints: ${mcpUrls.join(",")}`);
//tools adopt the process.cwd()
logger.info(`Working directory is ${workingDirectory}`);
process.chdir(workingDirectory);

const bot = new SignalBot({
  phoneNumber: `+1${process.env.SIGNAL_BOT_PHONE_NUMBER}`,
  recipientNumber: adminNumber,
  url: signalUrl,
  settings: {
    commandPrefix,
  },
});
const helpCommand = "help";
const newSessionCommand = "new_session";
const selectSessionCommand = "select_session";
const listSessionsCommand = "list_sessions";
const activeSessionCommand = "current_session";
const cancelLastMessage = "abort";

const onComplete = (fullMessage: string, isError: boolean) => {
  if (isError) {
    bot.sendMessage(`Bot didn't complete successfully! ${fullMessage}`);
  } else {
    const { reasoning, message } = parseMessage(
      startThinkToken,
      endThinkToken,
      fullMessage,
    );
    bot.sendMessage(message);
    logger.debug(`Reasoning: ${reasoning}, Message: ${message}`);
  }
};
const sessionManager = createSessionManager(
  openAiEndpoint,
  sessionDirectory,
  workingDirectory,
  mcpUrls,
  onComplete,
);

bot.addCommand({
  name: helpCommand,
  description: "Get lists of commands",
  adminOnly: true,
  handler: async () => {
    return bot
      .getCommands()
      .reduce<string>(
        (aggr, { name, description }) =>
          aggr + `\n${commandPrefix}${name}: ${description}`,
        "Commands:\n",
      );
  },
});

// Register a command "newsession".
bot.addCommand({
  name: newSessionCommand,
  description: "Create new session",
  adminOnly: true,
  handler: async () => {
    const sessionId = await sessionManager.newSession();
    return `New session created: ${sessionId}`;
  },
});

bot.addCommand({
  name: listSessionsCommand,
  description: "List sessions",
  adminOnly: true,
  handler: async () => {
    const sessions = await sessionManager.getSessions();
    const sessionsMessage = sessions.reduce(
      (aggr, curr, index) =>
        aggr +
        `\nIndex: ${index}\nSession ID: ${curr.sessionId}\nSummary: ${curr.summary}\n------------`,
      "",
    );
    return (
      sessionsMessage +
      `\n\nTo select a session use "${commandPrefix}${selectSessionCommand} {index}".`
    );
  },
});

bot.addCommand({
  name: activeSessionCommand,
  description: "Get current session id",
  adminOnly: true,
  handler: async () => {
    const sessionId = sessionManager.getSessionId();
    return `Session ID: ${sessionId}`;
  },
});

bot.addCommand({
  name: selectSessionCommand,
  description: "Select session",
  adminOnly: true,
  handler: async (sessionIndex: string) => {
    const sessions = await sessionManager.getSessions();
    try {
      const index = parseInt(sessionIndex);
      const { sessionId } = sessions[index];
      await sessionManager.setSessionId(sessionId);
      return `New session set: ${sessionId}`;
    } catch (err) {
      const error = err as Error;
      const msg = `Error! ${error.name}: ${error.message}`;
      logger.error(msg);
      return msg;
    }
  },
});

bot.addCommand({
  name: cancelLastMessage,
  description: "Abort current execution",
  adminOnly: true,
  handler: async () => {
    sessionManager.cancelMessage();
    return `Execution aborted.`;
  },
});

// Listen for any message, but ONLY respond to admin number
bot.on("message", (msg) => {
  const sender = msg.source;
  if (sender !== adminNumber) {
    console.error(`Unrecognized number ${sender}`);
    return;
  }
  sessionManager.queueMessage(msg.message);
  logger.info(`Message from ${sender}: ${msg.message}`);
});

bot.on("ready", async () => {
  logger.info("Bot is running!");
  await sessionManager.loadLastSessionOrCreateInitial();
});
await bot.start(commandPrefix);

process.on("SIGINT", () => {
  bot.close();
});
