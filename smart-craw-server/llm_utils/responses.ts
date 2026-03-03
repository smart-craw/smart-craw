import type {
  Query,
  HookCallback,
  NotificationHookInput,
  PermissionResult,
} from "@anthropic-ai/claude-agent-sdk";

type Block = {
  type: string;
  text: string;
};
export async function handleLLMResponse(
  query: Query,
  id: string, //just bot id?  What about "normal" llm?
  cbAssistance: (msg: string, id: string) => void,
  cbComplete: (id: string) => void,
  //cbResult: (msg: string, id: string) => void,
) {
  for await (const msg of query) {
    if (msg.type === "assistant") {
      const text = msg.message.content
        .filter((block: Block) => block.type === "text")
        .map((block: Block) => block.text)
        .join("");
      console.log("full message");
      console.log(text);
      cbComplete(id);
      //cbAssistance(text, id);
    }
    if (msg.type === "stream_event") {
      const { event } = msg;
      if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          cbAssistance(event.delta.text, id);
        }
      }
    }
    /*if (msg.type === "result") {
      //console.log(msg.result);
      cbResult(msg.result, id);
      }*/
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
