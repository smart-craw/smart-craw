import { type BotOutput } from "../models.ts";
import fs from "fs";
import { chdir } from "node:process";
import { LLM_NAME } from "../routes/router.ts";
import { generateBotPath } from "./utils.ts";
export async function createDirectoriesOnStart(
  directory: string,
  getBots: () => BotOutput[],
) {
  //tools adopt the process.cwd()
  chdir(directory);
  const allNames = [...getBots().map((b) => b.name), LLM_NAME];
  return await Promise.all(
    allNames.map((name) => {
      return new Promise<void>((res, rej) =>
        fs.mkdir(
          generateBotPath(directory, name),
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
