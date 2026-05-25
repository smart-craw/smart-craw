import "dotenv/config";
//import { WebSocketMessageQueue } from "./llm_utils/ws.ts";
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
} from "./routes/router.ts";
import { setAgents } from "./llm_utils/agentStore.ts";
import http from "http";
import st from "st";
import { logger } from "./logging.ts";
import { createDirectoriesOnStart } from "./file_utils/startup.ts";
import { manageBotFolder } from "./file_utils/bot_folder.ts";
import { uiPath, botPath } from "./locations.ts";
import { handleStreamingMessage } from "./routes/utils.ts";

const startThink = process.env.START_THINK_TOKEN || "<think>";
const endThink = process.env.END_THINK_TOKEN || "</think>";
const sessionStorageDirectory =
  process.env.SESSION_STORAGE_LOCATION || process.cwd();
logger.debug(`UI path: ${uiPath}`);
logger.debug(`Bot path: ${botPath}`);
logger.info(`Start and end tokens: ${startThink}, ${endThink}`);

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
const streamUtils = handleStreamingMessage(
  writeAllClients(wss),
  startThink,
  endThink,
);
const LLM_URL =
  process.env.OPEN_API_COMPATIBLE_ENDPOINT || "http://localhost:11434";
const holdAgents = setAgents(
  LLM_URL,
  getBots,
  streamUtils,
  botPath,
  sessionStorageDirectory,
  insertMessage,
);

//pass wss to anything that writes back, and write back to ALL
wss.on("connection", function connection(ws) {
  logger.info("Connection established");
  logger.info(`LLM server url: ${LLM_URL}`);
  //const messageQueue = new WebSocketMessageQueue(); //one per connection currently
  ws.on("error", (err) => {
    logger.error(err);
    //messageQueue.close();
  });
  ws.on("message", function message(data) {
    const { path, input } = JSON.parse(data.toString()) as WebSocketInputServer;
    switch (path) {
      case "/bot/create":
        routeCreateBot(
          input as CreateBotInput,
          LLM_URL,
          botPath,
          manageBotFolder(botPath, getBot),
          sessionStorageDirectory,
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
        //routeConversation(input as ConverseInput, messageQueue);
        break;
      /*case "/bot/approval":
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
        break;*/
    }
    logger.debug(`received: ${data}`);
  });

  ws.on("close", () => {
    logger.info("websocket closed");
    //messageQueue.close();
  });
});
