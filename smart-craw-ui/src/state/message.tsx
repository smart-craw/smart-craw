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

export type MessageState = Record<string, Message[]>;

export type MessageAction = MessagePayload & { type: string };

export function messageReducer(messages: MessageState, action: MessageAction) {
  const { type, ...rest } = action;
  switch (type) {
    case "added": {
      const { id, message, messageType } = rest;
      if (message === "<think>") {
        //then first time this has come through for the message, "create" message
        return {
          ...messages,
          [id]: [
            ...(messages[id] || []),
            {
              message: "",
              reasoning: "",
              partialReasoning: true,
              partialMessage: true,
              type: messageType,
            },
          ],
        };
      } else {
        //not first time, grab latest message to "manipulate"
        const messagesForBot = messages[id];
        const lastMessage = messagesForBot[messagesForBot.length - 1];
        const allButLast = (messages[id] || []).slice(0, -1);
        if (message === "</think>") {
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
        } else if (lastMessage.partialReasoning) {
          return {
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
          };
        } else if (!lastMessage.partialReasoning) {
          return {
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
      break;
    }
    case "complete": {
      const { id } = rest;
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
