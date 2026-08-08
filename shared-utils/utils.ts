import { BeforeToolCallEvent } from "@strands-agents/sdk";
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function blockProgramExecution(
  event: BeforeToolCallEvent,
  instructions: string,
) {
  if (event.toolUse.name === "bash" && isRecord(event.toolUse.input)) {
    const { command } = event.toolUse.input;
    if (
      typeof command === "string" &&
      /\b(node|npm|yarn|python3?|pip3?|cargo|rustc)\b/.test(command)
    ) {
      event.cancel = instructions;
    }
  }
}
