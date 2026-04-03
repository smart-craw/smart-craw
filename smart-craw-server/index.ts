import "dotenv/config";
import { WebSocketMessageQueue } from "./llm_utils/ws.ts";
import type {
  ApprovalInput,
  BotIdInput,
  ConverseInput,
  CreateBotInput,
} from "../shared/models.ts";
import {
  type ExecuteLLMInputServer,
  type WebSocketInputServer,
} from "./models.ts";
import {
  insertBot,
  getBot,
  getBots,
  insertMessage,
  removeBot,
  getMessages,
  insertBotCron,
} from "./db_utils/use_db.ts";

import { WebSocketServer } from "ws";
import {
  routeBotApproval,
  routeLlmApproval,
  routeConversation,
  routeCreateBot,
  routeExecuteBot,
  routeExecuteLlm,
  routeGetAllBots,
  routeGetMessages,
  routeRemoveBot,
  routeStopBot,
} from "./routes/router.ts";
import type { Query } from "@anthropic-ai/claude-agent-sdk";
import nodeCron from "node-cron";
import { startScheduler } from "./llm_utils/schedule.ts";
import http from "http";
import st from "st";
import { logger } from "./logging.ts";
import { createDirectoriesOnStart } from "./file_utils/startup.ts";
import { manageBotFolder } from "./file_utils/bot_folder.ts";
import { uiPath, botPath } from "./locations.ts";

logger.debug(`UI path: ${uiPath}`);
logger.debug(`Bot path: ${botPath}`);

const mount = st({
  path: uiPath,
  url: "/",
  index: "index.html",
});
const port = process.env.PORT ? parseInt(process.env.PORT) : 8000;
const server = http
  .createServer((req, res) => {
    mount(req, res, () => res.end("this is not a static file"));
  })
  .listen(port);
const wss = new WebSocketServer({ server });

const writeAllClients = (wss: WebSocketServer) => (message: string) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

//async
createDirectoriesOnStart(botPath, getBots);

//Global state
const pendingApprovals = new Map<string, (approved: boolean) => void>();
const holdQueries = new Map<string, Query>();
const scheduledBots: Map<string, nodeCron.ScheduledTask> = new Map(
  Object.entries(
    startScheduler(
      writeAllClients(wss),
      getBots,
      insertMessage,
      holdQueries,
      pendingApprovals,
    ),
  ),
);

//pass wss to anything that writes back, and write back to ALL
wss.on("connection", function connection(ws) {
  logger.info("Connection established");
  logger.info(`LLM server url: ${process.env.ANTHROPIC_BASE_URL}`);
  const messageQueue = new WebSocketMessageQueue(); //one per connection currently
  ws.on("error", (err) => {
    logger.error(err);
    messageQueue.close();
  });
  ws.on("message", function message(data) {
    const { path, input } = JSON.parse(data.toString()) as WebSocketInputServer;
    switch (path) {
      case "/bot/create":
        routeCreateBot(
          input as CreateBotInput,
          writeAllClients(wss),
          manageBotFolder(botPath, getBot),
          insertBot,
          insertBotCron,
          insertMessage,
          holdQueries,
          pendingApprovals,
          scheduledBots,
        );
        break;
      case "/bot/execute":
        routeExecuteBot(
          input as BotIdInput,
          writeAllClients(wss),
          getBot,
          insertMessage,
          holdQueries,
          pendingApprovals,
        );
        break;
      case "/bot/remove":
        routeRemoveBot(input as BotIdInput, removeBot, scheduledBots);
        break;
      case "/bot/stop":
        routeStopBot(input as BotIdInput, holdQueries);
        break;
      case "/bot/messages":
        routeGetMessages(
          input as BotIdInput,
          writeAllClients(wss),
          getMessages,
        );
        break;
      case "/bot/all":
        routeGetAllBots(writeAllClients(wss), getBots);
        break;
      case "/llm/instantiate":
        routeExecuteLlm(
          input as ExecuteLLMInputServer,
          writeAllClients(wss),
          messageQueue,
          holdQueries,
          pendingApprovals,
        );
        break;

      case "/llm/converse":
        routeConversation(input as ConverseInput, messageQueue);
        break;
      case "/bot/approval":
        routeBotApproval(
          input as ApprovalInput,
          writeAllClients(wss),
          pendingApprovals,
        );
        break;
      case "/llm/approval":
        routeLlmApproval(
          input as ApprovalInput,
          writeAllClients(wss),
          pendingApprovals,
        );
        break;
    }
    logger.debug(`received: ${data}`);
  });

  ws.on("close", () => {
    logger.info("websocket closed");
    messageQueue.close();
  });
});
