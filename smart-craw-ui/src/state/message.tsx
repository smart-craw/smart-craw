import { createContext } from "react";

type MessageOutput = {
  id: string; //message id
  message: string;
  reasoning: string;
  timestamp: Date | string | null;
};

export type MessagesOutput = {
  messages: MessageOutput[];
  id: string; //bot id
};

export type Message = MessageOutput & {
  partialReasoning: boolean; //true if reasoning isn't finished
  partialMessage: boolean;
  type: string; //user, assistant
};

export type MessagePayload = {
  id: string;
  message: string;
  messageType: string;
};

type MessageComplete = {
  id: string;
};

export type MessageState = Record<string, Message[]>;

export type MessageAction = (
  | MessagePayload
  | MessageComplete
  | MessagesOutput
) & {
  type: string;
};
export const MessageContext = createContext<MessageState | null>(null);
export const messageAction = {
  ADDED: "added",
  FINISHED: "finished",
  SET: "set",
} as const;

// eg 2026-03-05 16:48:21
// exported for testing
export function dateUtcConvertor(dateInUTC: string) {
  return new Date(`${dateInUTC.replace(" ", "T")}Z`);
}

export function messageReducer(messages: MessageState, action: MessageAction) {
  const { type, ...rest } = action;
  switch (type) {
    case messageAction.SET: {
      const { id, messages: messagesById } = rest as MessagesOutput;
      console.log(messagesById);
      return {
        ...messages,
        [id]: messagesById.map(
          ({ id, message, reasoning, timestamp }: MessageOutput) => ({
            id,
            message,
            reasoning,
            timestamp: dateUtcConvertor(timestamp as string),
            partialReasoning: false,
            partialMessage: false,
            type: "assistant",
          }),
        ),
      };
    }
    case messageAction.ADDED: {
      const { id, message, messageType } = rest as MessagePayload;
      const messagesForBot = messages[id];

      switch (message) {
        case "<think>": {
          return {
            ...messages,
            [id]: [
              ...(messagesForBot || []),
              {
                message: "",
                reasoning: "",
                partialReasoning: true,
                partialMessage: true,
                type: messageType,
                timestamp: null,
              },
            ],
          };
        }
        case "</think>": {
          //not first time, grab latest message to "manipulate"
          const lastMessage = messagesForBot[messagesForBot.length - 1];
          const allButLast = (messages[id] || []).slice(0, -1);
          return {
            ...messages,
            [id]: [
              ...allButLast,
              {
                message: "",
                reasoning: lastMessage.reasoning,
                partialReasoning: false,
                partialMessage: true,
                type: lastMessage.type,
                timestamp: null,
              },
            ],
          };
        }
        default: {
          //not first time, grab latest message to "manipulate"
          const lastMessage = messagesForBot[messagesForBot.length - 1];
          const allButLast = (messages[id] || []).slice(0, -1);

          return lastMessage.partialReasoning
            ? {
                //reasoning is not done, continue putting in reasoning
                ...messages,
                [id]: [
                  ...allButLast,
                  {
                    message: lastMessage.message,
                    reasoning: lastMessage.reasoning + message,
                    partialReasoning: true,
                    partialMessage: true,
                    type: lastMessage.type,
                    timestamp: null,
                  },
                ],
              }
            : {
                //reasoning is done, do normal message
                ...messages,
                [id]: [
                  ...allButLast,
                  {
                    message: lastMessage.message + message,
                    reasoning: lastMessage.reasoning,
                    partialReasoning: lastMessage.partialReasoning,
                    partialMessage: true,
                    type: lastMessage.type,
                    timestamp: null,
                  },
                ],
              };
        }
      }
    }
    case messageAction.FINISHED: {
      const { id } = rest as MessageComplete;
      const messagesForBot = messages[id];
      const lastMessage = messagesForBot[messagesForBot.length - 1];
      const allButLast = (messages[id] || []).slice(0, -1);
      return {
        ...messages,
        [id]: [
          ...allButLast,
          {
            message: lastMessage.message,
            reasoning: lastMessage.reasoning,
            partialReasoning: lastMessage.partialReasoning,
            partialMessage: false,
            type: lastMessage.type,
            timestamp: new Date(),
          },
        ],
      };
    }
    default: {
      throw Error("Unknown action: " + type);
    }
  }
}
