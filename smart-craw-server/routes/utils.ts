import { Action } from "../models.ts";

export type StreamUtils = {
  sendMessage: (
    message: string,
    id: string,
    isThinking: boolean,
    isTool?: boolean,
  ) => void;
  sendToClient: (message: string) => void;
};
export interface SplitReasoning {
  reasoning: string;
  message: string;
}
export function handleStreamingMessage(
  sendToClient: (message: string) => void,
): StreamUtils {
  return {
    sendMessage: (
      message: string,
      id: string,
      isThinking: boolean,
      isTool?: boolean,
    ) => {
      sendToClient(
        JSON.stringify({
          message,
          id,
          isThinking,
          action: isTool ? Action.ToolMessage : Action.AssistantMessage,
        }),
      );
    },
    sendToClient,
  };
}
