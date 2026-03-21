import type {
  Query,
  HookCallback,
  NotificationHookInput,
  PermissionResult,
  PermissionRequestHookInput,
  PostToolUseFailureHookInput,
} from "@anthropic-ai/claude-agent-sdk";
import { logger } from "../logging.ts";

interface SplitReasoning {
  reasoning: string;
  message: string;
}
//exported for testing
export function handleMessage(text: string): SplitReasoning {
  if (text.includes("</think>")) {
    const [reasoning, message] = text.split("</think>");
    return {
      reasoning: reasoning.replace("<think>", "").trim(),
      message: (message || "").trim(),
    };
  } else {
    //not a reasoning model
    return {
      reasoning: "",
      message: text.trim(),
    };
  }
}

export async function handleLLMResponse(
  query: Query,
  id: string, //just bot id?  What about "normal" llm?
  onStream: (msg: string, id: string) => void,
  onComplete: (id: string, message: string, reasoning: string) => void,
) {
  for await (const msg of query) {
    switch (msg.type) {
      //"result" always fires, so no need to action "assistant" type
      case "stream_event": {
        const { event } = msg;
        if (event.type === "content_block_delta") {
          if (event.delta.type === "text_delta") {
            onStream(event.delta.text, id);
          }
        }
        break;
      }
      case "result": {
        const { result } = msg;
        const { message, reasoning } = handleMessage(result);
        onComplete(id, message, reasoning);
        break;
      }
      default: {
        logger.debug("uncaught type", msg);
      }
    }
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
        logger.debug("notification received", notification);
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
