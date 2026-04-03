import { type BotOutput } from "../models.ts";
import fs from "fs";
import sanitize from "sanitize-filename";
import path from "path";
export async function createDirectoriesOnStart(
  directory: string,
  getBots: () => BotOutput[],
) {
  return await Promise.all(
    getBots().map((bot: BotOutput) => {
      return new Promise<void>((res, rej) =>
        fs.mkdir(
          path.join(directory, sanitize(bot.name)),
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
