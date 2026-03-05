import { createContext } from "react";
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

export const botAction = {
  SET: "set",
  ADDED: "added",
  APPROVAL: "approval",
  ACTIONED: "actioned",
  DELETED: "deleted",
  STARTED: "started",
  FINISHED: "finished",
} as const;

export type BotAction = (Bot | Bots | ApprovalA | Executing) & { type: string };

export const BotContext = createContext<Bot[] | null>(null);
export function botReducer(bots: Bot[], action: BotAction) {
  const { type, ...rest } = action;
  switch (type) {
    case botAction.SET: {
      const { bots } = rest as Bots;
      return bots;
    }
    case botAction.ADDED: {
      const { name, id, description, instructions, approval } = rest as Bot;
      return [
        ...bots,
        { name, id, description, instructions, approval, isExecuting: false },
      ];
    }
    case botAction.APPROVAL: {
      const { id, approval } = rest as ApprovalA;
      return bots.map((v) => (v.id === id ? { ...v, approval } : v));
    }
    case botAction.ACTIONED: {
      const { id } = rest as ApprovalA;
      return bots.map((v) => (v.id === id ? { ...v, approval: null } : v));
    }
    case botAction.DELETED: {
      const { id } = rest as Bot;
      return bots.filter((t) => t.id !== id);
    }
    case botAction.STARTED: {
      const { id } = rest as Executing;
      return bots.map((v) => (v.id === id ? { ...v, isExecuting: true } : v));
    }
    case botAction.FINISHED: {
      const { id } = rest as Executing;
      return bots.map((v) => (v.id === id ? { ...v, isExecuting: false } : v));
    }
    default: {
      throw Error("Unknown action: " + type);
    }
  }
}
