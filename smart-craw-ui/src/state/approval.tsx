export type Approval = {
  toolName: string;
  id: string;
  input: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

type Action = Approval & { type: string };
export function approvalReducer(approvals: Approval[], action: Action) {
  const { type, ...rest } = action;
  switch (type) {
    case "added": {
      return [...approvals, rest];
    }
    case "actioned": {
      return approvals.filter((v) => v.id !== rest.id);
    }
    default: {
      throw Error("Unknown action: " + type);
    }
  }
}
