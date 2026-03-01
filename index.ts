import { WebSocketMessageQueue } from "./llm_utils/ws";
import { type WebSocketInput } from "./models";

//put this behind an nginx proxy
import { WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws) {
  const messageQueue = new WebSocketMessageQueue();
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    const { path, input } = JSON.parse(data.toString()) as WebSocketInput;
    console.log("received: %s", data);
  });

  ws.send("something");
});
