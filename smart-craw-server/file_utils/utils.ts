import sanitize from "sanitize-filename";
import path from "path";
export const generateBotPath = (directory: string, botName: string) => {
  return path.join(directory, sanitize(botName));
};
