import { type CreateBotInput, type WebSocketInput } from "./models";

import { BotDefinition, botExecute, createBot } from "./llm_utils/bots";
import { insertBot, getBot } from "./db_utils/use_db";

//put this behind an nginx proxy
import { WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    const { path, input } = JSON.parse(data.toString()) as WebSocketInput;
    console.log("received: %s", data);
  });

  ws.send("something");
});
