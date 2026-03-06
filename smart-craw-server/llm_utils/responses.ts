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
  insertMessage: (id: string, message: string, reasoning: string) => void,
) {
  for await (const msg of query) {
    switch (msg.type) {
      case "assistant": {
        const text = msg.message.content
          .filter((block: Block) => block.type === "text")
          .map((block: Block) => block.text)
          .join("");
        cbComplete(id);
        const [reasoning, message] = text.split("</think>");
        insertMessage(id, message || "", reasoning.replace("<think>", ""));
        break;
      }
      case "stream_event": {
        const { event } = msg;
        if (event.type === "content_block_delta") {
          if (event.delta.type === "text_delta") {
            cbAssistance(event.delta.text, id);
          } /*else {
            console.log("not text delta");
            console.log(msg);
          }
        } else {
          console.log("not block delta");
          console.log(msg);*/
        }
        break;
      }
      case "result": {
        const { result } = msg;
        cbComplete(id);
        const [reasoning, message] = result.split("</think>");
        insertMessage(id, message || "", reasoning.replace("<think>", ""));
        break;
      }
      default: {
        console.log("uncaught type");
        console.log(msg);
      }
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
    console.log("got to approval callback");
    console.log(toolName);
    console.log(input);
    const isApproved = await approvalCb(toolName, input);

    return isApproved
      ? { behavior: "allow", updatedInput: input }
      : { behavior: "deny", message: "Tool use denied" };
  };
};
