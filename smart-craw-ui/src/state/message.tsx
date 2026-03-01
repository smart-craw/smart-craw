export type Message = {
  message: string;
  type: string; //user, assistant
};

type MessageAction = {
  id: string;
  message: string;
  messageType: string;
};

export type MessageState = Record<string, Message[]>;

type Action = MessageAction & { type: string };

export function messageReducer(messages: MessageState, action: Action) {
  const { type, ...rest } = action;
  switch (type) {
    case "added": {
      const { id, message, messageType } = rest;

      return {
        ...messages,
        [id]: [...(messages[id] || []), { message, type: messageType }],
      };
    }
    default: {
      throw Error("Unknown action: " + type);
    }
  }
}
