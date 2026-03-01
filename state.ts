export type BotState = {
  approval: boolean | null; //null means that there is no (recent) approval given
};
export type GlobalBotState = Record<string, BotState>;
export const holdBots: GlobalBotState = {};
