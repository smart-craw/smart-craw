import { createContext } from "react";
export type Approval = {
  toolName: string;
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

type ApprovalResponse = {
  id: string;
  approval: Approval | null;
};

type ApprovalAction = {
  id: string;
  approval: boolean;
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
  | ApprovalResponse
  | ApprovalAction
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
      const { id, approval } = rest as ApprovalAction;
      return bots.map((v) => (v.id === id ? { ...v, approval } : v));
    }
    case botAction.ACTIONED: {
      //if approval given, we are back to "isExecuting"
      const { id, approval } = rest as ApprovalResponse;
      console.log("actioned", approval);
      return bots.map((v) =>
        v.id === id ? { ...v, approval: null, isExecuting: approval } : v,
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
