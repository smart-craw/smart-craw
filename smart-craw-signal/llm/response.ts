import { logger } from "../logging.ts";
import { AgentResult, type AgentStreamEvent } from "@strands-agents/sdk";
export interface SplitReasoning {
  reasoning: string;
  message: string;
}

export async function handleLLMResponse(
  query: AsyncGenerator<AgentStreamEvent, AgentResult, undefined>,
  onComplete: (fullMessage: string, isError: boolean) => void,
) {
  let message = "";
  let reasoning = "";
  //need to ensure the app doesn't completely crash if agent errors
  try {
    for await (const msg of query) {
      switch (msg.type) {
        case "modelStreamUpdateEvent": {
          const { event } = msg;
          if (event.type === "modelContentBlockDeltaEvent") {
            if (
              event.delta.type === "reasoningContentDelta" &&
              event.delta.text
            ) {
              reasoning += event.delta.text;
            } else if (event.delta.type === "textDelta") {
              message += event.delta.text;
            }
          }
          break;
        }
        case "agentResultEvent": {
          const { result } = msg;
          if (
            result.stopReason === "endTurn" ||
            result.stopReason === "stopSequence"
          ) {
            onComplete(message, false);
            logger.info(`Reasoning: ${reasoning}`);
            logger.info(`Message: ${message}`);
          } else if (result.stopReason === "interrupt") {
            onComplete(result.toString(), false);
          } else if (
            result.stopReason === "maxTokens" ||
            result.stopReason === "modelContextWindowExceeded"
          ) {
            onComplete(`Stopped: ${result.stopReason}`, true);
            logger.error(`tokens or context exceeded: ${result.stopReason}`);
          }
          break;
        }

        // Errors surface here
        case "afterModelCallEvent": {
          if (msg.error) {
            onComplete(msg.error.message, true);
            logger.error(
              `afterModelCallEvent: ${msg.error.name}: ${msg.error.message}`,
            );
          }
          break;
        }

        default: {
          logger.debug(`Unmatched type ${JSON.stringify(msg, null, 2)}`);
        }
      }
    }
  } catch (err) {
    const error = err as Error;
    onComplete(error.message, true);
    logger.error(`Error! ${error.name}: ${error.message}`);
  }
}
