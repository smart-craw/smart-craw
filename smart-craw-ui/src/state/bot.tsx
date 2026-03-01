export type Bot = {
  name: string;
  id: string;
};

export type BotAction = Bot & { type: string };

export function botReducer(bots: Bot[], action: BotAction) {
  const { type, ...rest } = action;
  switch (type) {
    case "added": {
      return [...bots, rest];
    }
    case "deleted": {
      return bots.filter((t) => t.id !== rest.id);
    }
    default: {
      throw Error("Unknown action: " + type);
    }
  }
}
