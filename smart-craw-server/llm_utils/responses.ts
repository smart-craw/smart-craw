import type {
  Query,
  HookCallback,
  NotificationHookInput,
  PermissionResult,
  PermissionRequestHookInput,
  PostToolUseFailureHookInput,
} from "@anthropic-ai/claude-agent-sdk";
import { logger } from "../logging.ts";
import { type StreamUtils } from "../routes/utils.ts";

export async function handleLLMResponse(
  query: Query,
  id: string,
  streamUtils: StreamUtils,
  onComplete: (id: string, message: string, reasoning: string) => void,
  notificationCb: (message: string, type: string) => void,
) {
  let isThinking = false; //default to no thinking
  //need to ensure the app doesn't completely crash if claude errors
  try {
    for await (const msg of query) {
      switch (msg.type) {
        //"result" always fires, so no need to action "assistant" type
        case "stream_event": {
          const { event } = msg;
          if (event.type === "content_block_delta") {
            if (event.delta.type === "text_delta") {
              isThinking = streamUtils.detectThinking(
                event.delta.text,
                isThinking,
              );
              streamUtils.sendMessage(event.delta.text, id, isThinking);
            }
          }
          break;
        }
        case "result": {
          if (msg.subtype === "success") {
            const { result } = msg;
            const { message, reasoning } =
              streamUtils.parseCompleteMessage(result);
            onComplete(id, message, reasoning);
          } else {
            const errorText = msg.errors.reduce(
              (aggr, curr) => `${aggr}, ${curr}`,
            );
            onComplete(id, "error", errorText);
            notificationCb(errorText, "error");
            logger.error(`Error! ${errorText}`);
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
