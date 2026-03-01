import {
  Query,
  HookCallback,
  NotificationHookInput,
  PermissionResult,
} from "@anthropic-ai/claude-agent-sdk";
/*export async function handleLLMResult(
  query: Query,
  cb: (msg: string) => undefined,
) {
  for await (const msg of query) {
    if (msg.type === "result") {
      //console.log(msg.result);
      cb(msg.result);
    }
  }
  }*/

export async function handleLLMResponse(
  query: Query,
  id: string, //just bot id?  What about "normal" llm?
  cbAssistance: (msg: string, id: string) => void,
  cbResult: (msg: string, id: string) => void,
) {
  for await (const msg of query) {
    if (msg.type === "assistant") {
      const text = msg.message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");
      cbAssistance(text, id);
    }
    if (msg.type === "result") {
      //console.log(msg.result);
      cbResult(msg.result, id);
    }
  }
}

export const notificationWrapper = (
  notificationCb: (message: string, type: string) => void,
) => {
  const notificationHandler: HookCallback = async (
    input,
    toolUseID,
    { signal },
  ) => {
    const notification = input as NotificationHookInput;
    notificationCb(notification.message, notification.notification_type);
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
    const isApproved = await approvalCb(toolName, input);

    return isApproved
      ? { behavior: "allow" }
      : { behavior: "deny", message: "Tool use denied" };
  };
};
