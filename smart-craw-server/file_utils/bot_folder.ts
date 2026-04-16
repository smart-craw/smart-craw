import type { BotOutput, CreateBotInput } from "../../shared/models.ts";
import { logger } from "../logging.ts";
import fs from "fs";
import { generateBotPath } from "./utils.ts";
export const manageBotFolder =
  (directory: string, getBot: (id: string) => BotOutput | undefined) =>
  ({ id, name }: Pick<CreateBotInput, "id" | "name">) => {
    //id exists if doing an update
    if (id) {
      const prevBot = getBot(id);
      if (prevBot) {
        // should always be able to get prevBot if ID exists,
        // so the inside of this if statement should always execute
        fs.rename(
          generateBotPath(directory, prevBot.name),
          generateBotPath(directory, name),
          (err) => {
            if (err) {
              logger.error(`Error renaming directory for bot ${name} ${err}`);
            }
          },
        );
        return;
      }
    }
    // id doesn't exist or bot doesn't exist in database
    fs.mkdir(generateBotPath(directory, name), (err) => {
      if (err) {
        logger.error(`Error creating directory for bot ${name} ${err}`);
      }
    });
  };
