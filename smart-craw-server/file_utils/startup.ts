import { type BotOutput } from "../models.ts";
import fs from "fs";
import { generateBotPath } from "./utils.ts";
export async function createDirectoriesOnStart(
  directory: string,
  getBots: () => BotOutput[],
) {
  return await Promise.all(
    getBots().map((bot: BotOutput) => {
      return new Promise<void>((res, rej) =>
        fs.mkdir(
          generateBotPath(directory, bot.name),
          { recursive: true },
          (err) => {
            if (err) {
              rej(err);
            } else {
              res();
            }
          },
        ),
      );
    }),
  );
}
