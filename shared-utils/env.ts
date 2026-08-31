import { cwd, env } from "node:process";
import path from "node:path";
export const sessionDirectory =
  env.SESSION_DIRECTORY || path.join(cwd(), "./sessions");

const localWorkingDirectory = env.AGENT_CWD || cwd();

export const workingDirectory = path.isAbsolute(localWorkingDirectory)
  ? localWorkingDirectory
  : path.join(cwd(), localWorkingDirectory);

export const mcpUrls = env.MCP_SERVER_LIST
  ? JSON.parse(env.MCP_SERVER_LIST)
  : [];

export const llamaCppEndpoint =
  env.LLAMA_CPP_ENDPOINT || "http://localhost:11434";
