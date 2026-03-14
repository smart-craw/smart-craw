import { type Bot, type Llm } from "../state/store";
import { Popconfirm, Button, Badge } from "antd";
export const ButtonOption = {
  Approval: "approval",
  Stop: "stop",
  Run: "run",
} as const;

function stopRunApproval(
  approval: boolean,
  isExecuting: boolean,
): (typeof ButtonOption)[keyof typeof ButtonOption] {
  if (approval) {
    return ButtonOption.Approval;
  } else if (isExecuting) {
    return ButtonOption.Stop;
  } else {
    return ButtonOption.Run;
  }
}

type Props = Pick<Bot | Llm, "approval" | "id" | "isExecuting"> & {
  onConfirm: (id: string, toolName: string) => () => void;
  stopExecute: (id: string) => () => void;
  execute: (id: string) => () => void;
};

const LlmActionButton = ({
  approval,
  id,
  isExecuting,
  onConfirm,
  stopExecute,
  execute,
}: Props) => {
  const buttonType = stopRunApproval(approval !== undefined, isExecuting);
  let button;
  switch (buttonType) {
    case ButtonOption.Approval: {
      button = (
        <Popconfirm
          placement="top"
          title={approval!.toolName}
          description={JSON.stringify(approval!.input)}
          okText="Yes"
          cancelText="No"
          onConfirm={onConfirm(id, approval!.toolName)}
        >
          <Badge count={1}>
            <Button>Approval</Button>
          </Badge>
        </Popconfirm>
      );
      break;
    }
    case ButtonOption.Stop: {
      button = (
        <Button danger loading onClick={stopExecute(id)}>
          Stop
        </Button>
      );
      break;
    }
    case ButtonOption.Run: {
      button = (
        <Button type="primary" onClick={execute(id)}>
          Run
        </Button>
      );
      break;
    }
  }
  return button;
};

export default LlmActionButton;
