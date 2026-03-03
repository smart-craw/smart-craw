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
  isExecuting: boolean;
};

type ApprovalA = {
  id: string;
  approval: Approval | null;
};

type Executing = {
  id: string;
  //isExecuting: boolean;
};

export type Bots = {
  bots: Bot[];
};

export type BotAction = (Bot | Bots | ApprovalA | Executing) & { type: string };

export function botReducer(bots: Bot[], action: BotAction) {
  const { type, ...rest } = action;
  switch (type) {
    case "set": {
      const { bots } = rest as Bots;
      return bots;
    }
    case "added": {
      const { name, id, description, instructions, approval } = rest as Bot;
      return [
        ...bots,
        { name, id, description, instructions, approval, isExecuting: false },
      ];
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
    case "started": {
      const { id } = rest as Executing;
      return bots.map((v) => (v.id === id ? { ...v, isExecuting: true } : v));
    }
    case "finished": {
      const { id } = rest as Executing;
      return bots.map((v) => (v.id === id ? { ...v, isExecuting: false } : v));
    }
    default: {
      throw Error("Unknown action: " + type);
    }
  }
}
