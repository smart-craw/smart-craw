import { LoadingOutlined } from "@ant-design/icons";
import { type Bot } from "../state/store";
import { Button } from "antd";
export const ButtonOption = {
  Stop: "stop",
  Run: "run",
} as const;

function stopRunApproval(
  isExecuting: boolean,
): (typeof ButtonOption)[keyof typeof ButtonOption] {
  if (isExecuting) {
    return ButtonOption.Stop;
  } else {
    return ButtonOption.Run;
  }
}

type Props = Pick<Bot, "id" | "isExecuting"> & {
  stopExecute: (id: string) => () => void;
  execute: (id: string) => () => void;
};

const LlmActionButton = ({ id, isExecuting, stopExecute, execute }: Props) => {
  const buttonType = stopRunApproval(isExecuting);
  let button;
  switch (buttonType) {
    case ButtonOption.Stop: {
      button = (
        <Button
          danger
          icon={<LoadingOutlined spin />}
          onClick={stopExecute(id)}
        >
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
