import { createContext, type Dispatch } from "react";

//maps to MessageOutput on server
type MessageFromServer = {
  id: string; //message id
  message: string;
  reasoning: string;
  timestamp: string;
};

//for use "in app", gets translated from MessageFromServer
export type Message = {
  id: string; //message id
  message: string;
  reasoning: string;
  timestamp: Date;
  partialReasoning: boolean; //true if reasoning isn't finished
  partialMessage: boolean;
};

//used by ws service
export type MessagesFromServer = {
  messages: MessageFromServer[];
  id: string; //bot id
};

//used by ws service
export type MessagePayload = {
  id: string; //bot id
  message: string;
};

type MessageComplete = {
  id: string;
};

type MessageState = Record<string, Message[]>;

export type MessageAction = (
  | MessagePayload
  | MessageComplete
  | MessagesFromServer
) & {
  type: string;
};

type MessageValueDispatch = {
  value: MessageState;
  dispatch: Dispatch<MessageAction> | null;
};
export const MessageContext = createContext<MessageValueDispatch>({
  value: {},
  dispatch: (_value: MessageAction) => {},
});
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
      const { id, messages: messagesById } = rest as MessagesFromServer;
      console.log(messagesById);
      return {
        ...messages,
        [id]: messagesById.map(
          ({ id, message, reasoning, timestamp }: MessageFromServer) => ({
            id,
            message,
            reasoning,
            timestamp: dateUtcConvertor(timestamp as string),
            partialReasoning: false,
            partialMessage: false,
          }),
        ),
      };
    }
    case messageAction.ADDED: {
      const { id: botId, message } = rest as MessagePayload;
      const messagesForBot = messages[botId];

      switch (message) {
        case "<think>": {
          const id = window.crypto.randomUUID(); //temporary, gets overwritten once written to backend DB
          //first inputs
          return {
            ...messages,
            [botId]: [
              ...(messagesForBot || []),
              {
                id,
                message: "",
                reasoning: "",
                partialReasoning: true,
                partialMessage: true,
                timestamp: new Date(), //gets overwitten once written to backend DB
              },
            ],
          };
        }
        case "</think>": {
          //not first time, grab latest message to "manipulate"
          const lastMessage = messagesForBot[messagesForBot.length - 1];
          const allButLast = (messages[botId] || []).slice(0, -1);
          const { id, reasoning, timestamp } = lastMessage;
          return {
            ...messages,
            [botId]: [
              ...allButLast,
              {
                id,
                message: "",
                reasoning: reasoning,
                partialReasoning: false,
                partialMessage: true,
                timestamp,
              },
            ],
          };
        }
        default: {
          //not first time, grab latest message to "manipulate"
          const lastMessage = messagesForBot[messagesForBot.length - 1];
          const allButLast = (messages[botId] || []).slice(0, -1);
          const {
            id,
            reasoning,
            timestamp,
            message: currentMessage,
            partialReasoning,
          } = lastMessage;

          return lastMessage.partialReasoning
            ? {
                //reasoning is not done, continue putting in reasoning
                ...messages,
                [botId]: [
                  ...allButLast,
                  {
                    id,
                    message: currentMessage,
                    reasoning: reasoning + message,
                    partialReasoning: true,
                    partialMessage: true,
                    timestamp,
                  },
                ],
              }
            : {
                //reasoning is done, do normal message
                ...messages,
                [botId]: [
                  ...allButLast,
                  {
                    id,
                    message: currentMessage + message,
                    reasoning: reasoning,
                    partialReasoning: partialReasoning,
                    partialMessage: true,
                    timestamp,
                  },
                ],
              };
        }
      }
    }
    case messageAction.FINISHED: {
      const { id: botId } = rest as MessageComplete;
      const messagesForBot = messages[botId];
      const lastMessage = messagesForBot[messagesForBot.length - 1];
      const allButLast = (messages[botId] || []).slice(0, -1);
      const { id, message, reasoning, partialReasoning, timestamp } =
        lastMessage;
      return {
        ...messages,
        [botId]: [
          ...allButLast,
          {
            id,
            message,
            reasoning,
            partialReasoning,
            partialMessage: false,
            timestamp,
          },
        ],
      };
    }
    default: {
      throw Error("Unknown action: " + type);
    }
  }
}
