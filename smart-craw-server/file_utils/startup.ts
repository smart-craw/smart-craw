import { type BotOutput } from "../models.ts";
import fs from "fs";
import sanitize from "sanitize-filename";
export async function createDirectoriesOnStart(getBots: () => BotOutput[]) {
  return await Promise.all(
    getBots().map((bot: BotOutput) => {
      return new Promise<void>((res, rej) =>
        fs.mkdir(sanitize(bot.name), { recursive: true }, (err) => {
          if (err) {
            rej(err);
          } else {
            res();
          }
        }),
      );
    }),
  );
}
