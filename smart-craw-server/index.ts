import "dotenv/config";
import type {
  BotIdInput,
  ConverseInput,
  CreateBotInput,
} from "../shared/models.ts";
import { type WebSocketInputServer } from "./models.ts";
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
  routeCreateBot,
  routeExecuteBot,
  routeExecuteLlm,
  routeGetAllBots,
  routeGetMessages,
  routeRemoveBot,
  routeStopBot,
  routeInstantiateLlm,
  routeDeleteSession,
  LLM_ID,
} from "./routes/router.ts";
import { setAgents } from "./llm_utils/agent_store.ts";
import { logger } from "./logging.ts";
import { createDirectoriesOnStart } from "./file_utils/startup.ts";
import { manageBotFolder } from "./file_utils/bot_folder.ts";
import { uiPath, isServerOnly } from "./locations.ts";
import { handleStreamingMessage } from "./routes/utils.ts";
import { generateServer } from "./server.ts";

import {
  workingDirectory,
  sessionDirectory,
  mcpUrls,
  llamaCppEndpoint,
} from "../shared-utils/env.ts";

if (!isServerOnly) {
  logger.debug(`UI path: ${uiPath}`);
}
logger.info(`Bot path: ${workingDirectory}`);
//tools adopt the process.cwd()
process.chdir(workingDirectory);

const port = process.env.PORT ? parseInt(process.env.PORT) : 8000;
const server = generateServer(isServerOnly, uiPath, port);
const wss = new WebSocketServer({ server });

const writeAllClients = (wss: WebSocketServer) => (message: string) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

//async
createDirectoriesOnStart(workingDirectory, getBots);

//Global state
const streamUtils = handleStreamingMessage(writeAllClients(wss));

const holdAgents = await setAgents(
  llamaCppEndpoint,
  getBots,
  streamUtils,
  workingDirectory,
  sessionDirectory,
  mcpUrls,
  insertMessage,
);

//pass wss to anything that writes back, and write back to ALL
wss.on("connection", function connection(ws) {
  logger.info("Connection established");
  logger.info(`LLM server url: ${llamaCppEndpoint}`);
  ws.on("error", (err) => {
    logger.error(err);
  });
  ws.on("message", function message(data) {
    const { path, input } = JSON.parse(data.toString()) as WebSocketInputServer;
    switch (path) {
      case "/bot/create":
        routeCreateBot(
          input as CreateBotInput,
          llamaCppEndpoint,
          workingDirectory,
          manageBotFolder(workingDirectory, getBot),
          sessionDirectory,
          mcpUrls,
          insertBot,
          insertBotCron,
          streamUtils,
          insertMessage,
          holdAgents,
        );
        break;
      case "/bot/execute":
        routeExecuteBot(
          input as BotIdInput,
          streamUtils,
          insertMessage,
          holdAgents,
        );
        break;
      case "/bot/remove":
        routeRemoveBot(input as BotIdInput, removeBot, holdAgents);
        break;
      case "/bot/stop":
        routeStopBot(input as BotIdInput, holdAgents);
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
        routeInstantiateLlm(streamUtils);
        break;

      case "/llm/converse":
        const { message } = input as ConverseInput;
        routeExecuteLlm(message, streamUtils, holdAgents);
        break;
      case "/llm/clear":
        routeDeleteSession({ id: LLM_ID }, streamUtils, holdAgents);
        break;
    }
    logger.debug(`received: ${data}`);
  });

  ws.on("close", () => {
    logger.info("websocket closed");
  });
});
