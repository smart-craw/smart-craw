import { Action } from "../models.ts";

export type StreamUtils = {
  sendMessage: (message: string, id: string, isThinking: boolean) => void;
  parseCompleteMessage: (text: string) => SplitReasoning;
  detectThinking: (text: string, isThinking: boolean) => boolean;
  sendToClient: (message: string) => void;
};
export interface SplitReasoning {
  reasoning: string;
  message: string;
}
export function handleStreamingMessage(
  sendToClient: (message: string) => void,
  startThink: string,
  endThink: string,
): StreamUtils {
  return {
    sendMessage: (message: string, id: string, isThinking: boolean) => {
      sendToClient(
        JSON.stringify({
          message: message.replace(startThink, "").replace(endThink, ""),
          id,
          isThinking,
          action: Action.AssistantMessage,
        }),
      );
    },
    parseCompleteMessage: (text: string) => {
      if (text.includes(endThink)) {
        const [reasoning, message] = text.split(endThink);
        return {
          reasoning: reasoning.replace(startThink, "").trim(),
          message: (message || "").trim(),
        } as SplitReasoning;
      } else {
        //not a reasoning model
        return {
          reasoning: "",
          message: text.trim(),
        } as SplitReasoning;
      }
    },
    detectThinking: (text: string, isThinking: boolean) => {
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
    },
    sendToClient,
  };
}
