export type Approval = {
  toolName: string;
  //id: string;
  input: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};
export type Bot = {
  name: string;
  id: string;
  description: string;
  instructions: string;
  approval: Approval | null;
};

type ApprovalA = {
  id: string;
  approval: Approval | null;
};

export type Bots = {
  bots: Bot[];
};

export type BotAction = (Bot | Bots | ApprovalA) & { type: string };

export function botReducer(bots: Bot[], action: BotAction) {
  const { type, ...rest } = action;
  switch (type) {
    case "set": {
      const { bots } = rest as Bots;
      return bots;
    }
    case "added": {
      const { name, id, description, instructions, approval } = rest as Bot;
      return [...bots, { name, id, description, instructions, approval }];
    }
    case "approval": {
      const { id, approval } = rest as ApprovalA;
      return bots.map((v) => (v.id === id ? { ...v, approval } : v));
    }
    case "actioned": {
      const { id } = rest as ApprovalA;
      return bots.map((v) => (v.id === id ? { ...v, approval: null } : v));
    }
    case "deleted": {
      const { id } = rest as Bot;
      return bots.filter((t) => t.id !== id);
    }
    default: {
      throw Error("Unknown action: " + type);
    }
  }
}
