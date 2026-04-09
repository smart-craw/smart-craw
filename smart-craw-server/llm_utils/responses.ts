import type {
  Query,
  HookCallback,
  NotificationHookInput,
  PermissionResult,
  PermissionRequestHookInput,
  PostToolUseFailureHookInput,
} from "@anthropic-ai/claude-agent-sdk";
import { logger } from "../logging.ts";

export interface SplitReasoning {
  reasoning: string;
  message: string;
}

export function handleMessage(
  startThink: string,
  endThink: string,
): (text: string) => SplitReasoning {
  return (text: string) => {
    if (text.includes(endThink)) {
      const [reasoning, message] = text.split(endThink);
      return {
        reasoning: reasoning.replace(startThink, "").trim(),
        message: (message || "").trim(),
      };
    } else {
      //not a reasoning model
      return {
        reasoning: "",
        message: text.trim(),
      };
    }
  };
}

export function isStreamThinking(
  startThink: string,
  endThink: string,
): (text: string, isThinking: boolean) => boolean {
  return (text: string, isThinking: boolean) => {
    if (text.includes(startThink)) {
      // need the ternary in case startThink is the same as endThink
      // otherwise could just return `true`
      return isThinking ? false : true;
    } else if (text.includes(endThink)) {
      //only gets here if endThink is different from startThink
      return false;
    } else {
      return isThinking;
    }
  };
}

export async function handleLLMResponse(
  query: Query,
  id: string,
  onStream: (msg: string, id: string, isThinking: boolean) => void,
  onComplete: (id: string, message: string, reasoning: string) => void,
  extractReasoning: (text: string) => SplitReasoning,
  handleReasoningStreaming: (text: string, isThinking: boolean) => boolean,
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
              isThinking = handleReasoningStreaming(
                event.delta.text,
                isThinking,
              );
              onStream(event.delta.text, id, isThinking);
            }
          }
          break;
        }
        case "result": {
          if (msg.subtype === "success") {
            const { result } = msg;
            const { message, reasoning } = extractReasoning(result);
            onComplete(id, message, reasoning);
          } else {
            const errorText = msg.errors.reduce(
              (aggr, curr) => `${aggr}, ${curr}`,
            );
            //TODO! Better/rigorous error handling
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
    //TODO! Better/rigorous error handling
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
