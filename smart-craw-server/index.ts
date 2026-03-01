import { WebSocketMessageQueue } from "./llm_utils/ws";
import {
  ApprovalInput,
  BotIdInput,
  ConverseInput,
  CreateBotInput,
  ExecuteLLMInput,
  type WebSocketInput,
} from "./models";

//put this behind an nginx proxy
import { WebSocketServer } from "ws";
import {
  routeApproval,
  routeConversation,
  routeCreateBot,
  routeExecuteBot,
  routeExecuteLlm,
} from "./routes/router";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws) {
  const messageQueue = new WebSocketMessageQueue();
  ws.on("error", (err) => {
    console.error(err);
    messageQueue.close();
  });

  ws.on("message", function message(data) {
    const { path, input } = JSON.parse(data.toString()) as WebSocketInput;
    switch (path) {
      case "/bot/create":
        routeCreateBot(input as CreateBotInput, ws);
        break;
      case "/bot/execute":
        routeExecuteBot(input as BotIdInput, ws);
        break;
      case "/llm/execute":
        routeExecuteLlm(input as ExecuteLLMInput, ws, messageQueue);
        break;
      case "/llm/converse":
        routeConversation(input as ConverseInput, messageQueue);
        break;
      case "/tool/approval":
        routeApproval(input as ApprovalInput);
        break;
    }
    console.log("received: %s", data);
  });

  ws.on("close", () => {
    messageQueue.close();
  });
});
