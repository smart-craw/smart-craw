import { createContext, type Dispatch } from "react";
import type {
  Approval,
  ApprovalActioned,
  ApprovalRequestedFromServer,
} from "../services/types";

//App-side Llm definition
export type Llm = {
  id: string;
  instructions: string;
  approval?: Approval;
  isExecuting: boolean;
  result: string;
};

/*type Executing = {
  id: string;
  //isExecuting: boolean;
};*/

export const llmAction = {
  SET: "set",
  APPROVAL: "approval",
  ACTIONED: "actioned",
  STARTED: "started",
  FINISHED: "finished",
} as const;
type LlmMessage = {
  result: string;
};
type LlmActionType = (typeof llmAction)[keyof typeof llmAction];
//interface Empty {}
export type LlmAction =
  | ((Llm | ApprovalRequestedFromServer | ApprovalActioned | LlmMessage) & {
      type: LlmActionType;
    })
  | { type: LlmActionType };

type LlmValueDispatch = {
  value: Llm;
  dispatch: Dispatch<LlmAction>;
};

export const dummyLlm = {
  id: "hello",
  instructions: "",
  result: "",
  approval: undefined,
  isExecuting: false,
};
export const LlmContext = createContext<LlmValueDispatch>({
  value: dummyLlm,
  dispatch: (_value: LlmAction) => {},
});
export function llmReducer(llm: Llm, action: LlmAction) {
  const { type, ...rest } = action;
  switch (type) {
    case llmAction.SET: {
      const v = rest as Llm;
      return v;
    }
    case llmAction.APPROVAL: {
      const { id, toolName, input } = rest as ApprovalRequestedFromServer;
      return { ...llm, id, approval: { toolName, input } };
    }
    case llmAction.ACTIONED: {
      //if approved, we are back to "isExecuting"
      const { approved } = rest as ApprovalActioned;
      console.log("actioned", approved);
      return { ...llm, approval: undefined, isExecuting: approved };
    }
    case llmAction.STARTED: {
      //const { id } = rest as Llm;
      return { ...llm, isExecuting: true };
    }
    case llmAction.FINISHED: {
      const { result } = rest as LlmMessage;
      return { ...llm, result, isExecuting: false };
    }
    default: {
      throw Error("Unknown action: " + type);
    }
  }
}
