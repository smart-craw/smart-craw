import { getBot, insertBot } from "../db_utils/use_db";
import { botExecute, createBot } from "../llm_utils/bots";
import { handleLLMResponse } from "../llm_utils/responses";
import { BotIdInput, CreateBotInput } from "../models";
const Action = {
  CreateBot: "createbot",
  ExecuteBot: "executebot",
  Approval: "approval",
  AssistantMessage: "assistantmessage",
  ResultMessage: "resultmessage",
} as const;
export const routeCreateBot = (
  { description, name, instructions }: CreateBotInput,
  ws: WebSocket,
) => {
  const bot = createBot(name, description, instructions, null);
  const botDefinition = bot.definition[bot.name];
  insertBot.run(
    bot.id,
    botDefinition.description,
    bot.name,
    botDefinition.prompt,
  );
  ws.send(
    JSON.stringify({
      id: bot.id,
      name: bot.name,
      action: Action.CreateBot,
    }),
  );
  //return ;
};
export const routeExecuteBot = ({ id }: BotIdInput, ws: WebSocket) => {
  const { name, description, instructions } = getBot.get(id) as CreateBotInput;
  const bot = createBot(name, description, instructions, id);
  //const botDefinition = bot.definition[bot.name];
  const query = botExecute(bot);
  handleLLMResponse(query, id, assistantMessage(ws), resultMessage(ws));
  /*return {
    id: bot.id,
    name: bot.name,
    action: Action.CreateBot,
  };*/
};

export const routeApproval =({approved}:ApprovalInput)=>{

}

//yuck, I also need a response back...
export const approvalWebsocket =
  (ws: WebSocket, cb: ) => async (toolName: string, input: any) => {
    ws.send(
      JSON.stringify({
        toolName,
        input,
        action: Action.Approval,
      }),
    );
    await cb()
  };

export const assistantMessage =
  (ws: WebSocket) => (message: string, id: string) => {
    ws.send(
      JSON.stringify({
        message,
        id,
        action: Action.AssistantMessage,
      }),
    );
  };

export const resultMessage =
  (ws: WebSocket) => (message: string, id: string) => {
    ws.send(
      JSON.stringify({
        message,
        id,
        action: Action.ResultMessage,
      }),
    );
  };
