export type Message = {
  reasoning: string;
  message: string;
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

export type MessageAction = (MessagePayload | MessageComplete) & {
  type: string;
};

export function messageReducer(messages: MessageState, action: MessageAction) {
  const { type, ...rest } = action;
  switch (type) {
    case "added": {
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
                  },
                ],
              };
        }
      }
    }
    case "complete": {
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
          },
        ],
      };
    }
    default: {
      throw Error("Unknown action: " + type);
    }
  }
}
