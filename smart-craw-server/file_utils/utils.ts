import sanitize from "sanitize-filename";
import path from "path";
export const generateBotPath = (directory: string, botName: string) => {
  //const botFolderPath = sanitize(botName).replace(/\W+/g, "_");
  return path.join(directory, sanitize(botName));
};
