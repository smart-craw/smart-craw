import { logger } from "../logging.ts";
import { type StreamUtils } from "../routes/utils.ts";
import { AgentResult, type AgentStreamEvent } from "@strands-agents/sdk";
export async function handleLLMResponse(
  query: AsyncGenerator<AgentStreamEvent, AgentResult, undefined>,
  id: string,
  streamUtils: StreamUtils,
  onComplete: (id: string, message: string, reasoning: string) => void,
  notificationCb: (message: string, type: string) => void,
) {
  //need to ensure the app doesn't completely crash if claude errors
  try {
    for await (const msg of query) {
      switch (msg.type) {
        case "modelStreamUpdateEvent": {
          const { event } = msg;
          console.log(event);
          if (event.type === "modelContentBlockDeltaEvent") {
            if (
              event.delta.type === "reasoningContentDelta" &&
              event.delta.text
            ) {
              streamUtils.sendMessage(
                event.delta.text,
                id,
                /* isThinking */ true,
              );
            } else if (event.delta.type === "textDelta") {
              streamUtils.sendMessage(
                event.delta.text,
                id,
                /* isThinking */ false,
              );
            }
          }
          break;
        }
        case "beforeToolCallEvent": {
          if (msg.tool) {
            streamUtils.sendMessage(msg.tool.name, id, false, true);
          }
          break;
        }
        case "agentResultEvent": {
          const { result } = msg;
          if (
            result.stopReason === "endTurn" ||
            result.stopReason === "stopSequence"
          ) {
            const text = result.lastMessage.content
              .filter((v) => v.type === "textBlock")
              .reduce((agg, curr) => agg + curr.text, "");
            const { message, reasoning } =
              streamUtils.parseCompleteMessage(text);
            onComplete(id, message, reasoning);
          } else if (result.stopReason === "interrupt") {
            onComplete(id, "error", result.stopReason);
          } else if (
            result.stopReason === "maxTokens" ||
            result.stopReason === "modelContextWindowExceeded"
          ) {
            onComplete(id, "error", result.stopReason);
          }
          break;
        }
        default: {
          logger.debug(`uncaught type ${msg}`);
        }
      }
    }
  } catch (err) {
    const error = err as Error;
    onComplete(id, "error", error.message);
    notificationCb(error.message, "error");
    logger.error(`Error! ${error.name}: ${error.message}`);
  }
}
