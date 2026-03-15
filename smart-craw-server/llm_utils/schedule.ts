import nodeCron from "node-cron";
import { type BotOutput } from "../models.ts";
import { type Query } from "@anthropic-ai/claude-agent-sdk";
import { executeBot } from "../routes/router.ts";
export const startScheduler = (
  sendToClient: (message: string) => void,
  getBots: () => BotOutput[],
  insertMessage: (id: string, message: string, reasoning: string) => void,
  holdQueries: Map<string, Query>,
  pendingApprovals: Map<string, (approved: boolean) => void>,
) => {
  return getBots()
    .filter((v) => v.cron !== null)
    .map((bot: BotOutput) => {
      return {
        id: bot.id,
        job: nodeCron.schedule(bot.cron!, () => {
          executeBot(
            bot,
            sendToClient,
            insertMessage,
            holdQueries,
            pendingApprovals,
          );
          //createBot is super cheap, no need to "cache" it
          /*const bot = createBot(name, description, instructions, id);
          console.log("running scheduled bot ", id);
          const query = botExecute(
            bot,
            approvalWebsocket(
              bot.id,
              sendToClient,
              Assistant.Bot,
              pendingApprovals,
            ),
            notification(sendToClient),
          );
          holdQueries.set(id, query);
          handleLLMResponse(
            query,
            id,
            assistantMessage(sendToClient),
            completeMessage(sendToClient, insertMessage),
            );*/
        }),
      };
    })
    .reduce((aggr, curr) => {
      return { ...aggr, [curr.id]: curr.job };
    }, {});
};
