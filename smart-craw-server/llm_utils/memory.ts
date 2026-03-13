import type {
  HookCallback,
  PreToolUseHookInput,
} from "@anthropic-ai/claude-agent-sdk";
export function createPath(id: string, name: string) {
  return `${process.cwd()}/memory/${name}-${id}.md`;
}
export function writeOwnKnowledge(path: string) {
  return `You are a helpful and autonomous bot.
  If you learn anything interesting, or hit an unexpected block, write this to this file: ${path}.
  Do not overwrite this file, instead append to it.
  When you start a new task, make sure you read the file so you can learn from your past experiences.
  If no such file exists, create it.

  Now, execute these instructions:
  `;
}

interface ToolInput {
  file_path: string;
}
export const autoApproveWriteMemory: (path: string) => HookCallback =
  (path: string) => async (input, _toolUseID, _signal) => {
    if (input.hook_event_name !== "PreToolUse") return {};
    const preInput = input as PreToolUseHookInput;
    const filePath = (preInput.tool_input as ToolInput).file_path;
    if (filePath === path) {
      return {
        hookSpecificOutput: {
          hookEventName: preInput.hook_event_name,
          permissionDecision: "allow",
          permissionDecisionReason: "Write to memory allowed",
        },
      };
    }
    return {};
  };
