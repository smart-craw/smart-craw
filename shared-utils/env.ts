import { cwd, env } from "node:process";
import path from "node:path";
export const sessionDirectory =
  env.SESSION_STORAGE_LOCATION || path.join(cwd(), "./sessions");
export const startThinkToken = env.START_THINK_TOKEN || "<think>";
export const endThinkToken = env.END_THINK_TOKEN || "</think>";
const localWorkingDirectory = env.AGENT_CWD || cwd();

export const workingDirectory = path.isAbsolute(localWorkingDirectory)
  ? localWorkingDirectory
  : path.join(cwd(), localWorkingDirectory);

export const mcpUrls = env.MCP_SERVER_LIST
  ? JSON.parse(env.MCP_SERVER_LIST)
  : [];

export const openAiEndpoint =
  env.OPEN_API_COMPATIBLE_ENDPOINT || "http://localhost:11434";
