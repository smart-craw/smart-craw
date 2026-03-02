export type Message = {
  message: string;
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
