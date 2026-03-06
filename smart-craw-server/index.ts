import { WebSocketMessageQueue } from "./llm_utils/ws.ts";
import type {
  ApprovalInput,
  BotIdInput,
  ConverseInput,
  CreateBotInput,
  ExecuteLLMInput,
  WebSocketInput,
} from "./models.ts";
import {
  insertBot,
  getBot,
  getBots,
  insertMessage,
  removeBot,
  getMessages,
} from "./db_utils/use_db.ts";

//put this behind an nginx proxy
import { WebSocketServer } from "ws";
import {
  routeApproval,
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
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws) {
  //this is mutable state.
  const pendingApprovals = new Map<string, (approved: boolean) => void>();
  const holdQueries = new Map<string, Query>();
  const messageQueue = new WebSocketMessageQueue();
  ws.on("error", (err) => {
    console.error(err);
    messageQueue.close();
  });
  ws.on("message", function message(data) {
    const { path, input } = JSON.parse(data.toString()) as WebSocketInput;
    switch (path) {
      case "/bot/create":
        routeCreateBot(input as CreateBotInput, ws, insertBot);
        break;
      case "/bot/execute":
        routeExecuteBot(
          input as BotIdInput,
          ws,
          getBot,
          insertMessage,
          holdQueries,
          pendingApprovals,
        );
        break;
      case "/bot/remove":
        routeRemoveBot(input as BotIdInput, removeBot);
        break;
      case "/bot/stop":
        routeStopBot(input as BotIdInput, holdQueries);
        break;
      case "/bot/messages":
        routeGetMessages(input as BotIdInput, ws, getMessages);
        break;
      case "/bot/all":
        routeGetAllBots(ws, getBots);
        break;
      case "/llm/execute":
        routeExecuteLlm(
          input as ExecuteLLMInput,
          ws,
          messageQueue,
          getBots,
          insertMessage,
          holdQueries,
          pendingApprovals,
        );
        break;
      case "/llm/converse":
        routeConversation(input as ConverseInput, messageQueue);
        break;
      case "/tool/approval":
        console.log(pendingApprovals);
        console.log(input);
        routeApproval(input as ApprovalInput, ws, pendingApprovals);
        break;
    }
    console.log("received: %s", data);
  });

  ws.on("close", () => {
    messageQueue.close();
  });
});
