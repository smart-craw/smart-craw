import { createContext } from "react";
type Approval = {
  toolName: string;
  input: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

//App-side Bot definition
export type Bot = {
  name: string;
  id: string;
  description: string;
  instructions: string;
  approval?: Approval;
  isExecuting: boolean;
};

export type ApprovalRequestedFromServer = Approval & {
  id: string;
};

// this is from server OR from client ("optimistically" updated client side)
export type ApprovalActioned = {
  id: string;
  approved: boolean;
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

export type BotAction = (
  | Bot
  | Bots
  | ApprovalRequestedFromServer
  | ApprovalActioned
  | Executing
) & { type: string };

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
      const { id, toolName, input } = rest as ApprovalRequestedFromServer;
      return bots.map((v) =>
        v.id === id ? { ...v, approval: { toolName, input } } : v,
      );
    }
    case botAction.ACTIONED: {
      //if approved, we are back to "isExecuting"
      const { id, approved } = rest as ApprovalActioned;
      console.log("actioned", approved);
      return bots.map((v) =>
        v.id === id ? { ...v, approval: undefined, isExecuting: approved } : v,
      );
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
