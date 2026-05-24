import { logger } from "../logging.ts";
import { type StreamUtils } from "../routes/utils.ts";
import { AgentResult, type AgentStreamEvent } from "@strands-agents/sdk";
export async function handleLLMResponse(
  query: AsyncGenerator<AgentStreamEvent, AgentResult, undefined>,
  id: string,
  streamUtils: StreamUtils,
  onComplete: (id: string, message: string, reasoning: string) => void,
  //notificationCb: (message: string, type: string) => void,
) {
  let isThinking = false; //default to no thinking
  //need to ensure the app doesn't completely crash if claude errors
  try {
    for await (const msg of query) {
      switch (msg.type) {
        case "modelStreamUpdateEvent": {
          const { event } = msg;
          if (event.type === "modelContentBlockDeltaEvent") {
            if (event.delta.type === "textDelta") {
              isThinking = streamUtils.detectThinking(
                event.delta.text,
                isThinking,
              );
              streamUtils.sendMessage(event.delta.text, id, isThinking);
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
        /*case "beforeToolsEvent": {
          const toolMessage = msg.message.content
            .filter((v) => v.type === "textBlock")
            .reduce((agg, curr) => agg + curr.text, "");
          streamUtils.sendMessage(toolMessage, id, false, true);
          break;
          }*/
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
    logger.error(`Error! ${error.name}: ${error.message}`);
  }
}
/*
export const notificationWrapper = (
  notificationCb: (message: string, type: string) => void,
) => {
  const notificationHandler: HookCallback = async (
    input,
    _toolUseID,
    //{ signal },
  ) => {
    switch (input.hook_event_name) {
      case "PermissionRequest": {
        const notification = input as PermissionRequestHookInput;
        notificationCb(
          JSON.stringify(notification.permission_suggestions) || "",
          "Permission Request",
        );
        break;
      }
      case "PostToolUseFailure": {
        const notification = input as PostToolUseFailureHookInput;
        notificationCb(notification.error, "Tool Error");
        break;
      }
      default: {
        const notification = input as NotificationHookInput;
        logger.debug(`Notification received ${notification}`);
        notificationCb(notification.message, notification.notification_type);
      }
    }

    return {};
  };
  return notificationHandler;
};

export const approvalWrapper = (
  approvalCb: (toolName: string, input: any) => Promise<boolean>,
) => {
  return async function customApprovalCallback(
    toolName: string,
    input: any,
  ): Promise<PermissionResult> {
    logger.debug("Approval called");
    const isApproved = await approvalCb(toolName, input);
    return isApproved
      ? { behavior: "allow", updatedInput: input }
      : { behavior: "deny", message: "Tool use denied" };
  };
};
*/
