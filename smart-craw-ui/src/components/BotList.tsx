import { List, Popconfirm, Button, Badge } from "antd";

import type { Bot } from "../state/bot";

interface Props {
  data: Bot[];
  onConfirm: (id: string, toolName: string) => () => void;
  execute: (id: string) => () => void;
  stopExecute: (id: string) => () => void;
  onDelete: (id: string) => () => void;
  onShowMessage: (id: string) => () => void;
}
const ButtonOption = {
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
const BotList: React.FC<Props> = ({
  data,
  onConfirm,
  execute,
  stopExecute,
  onDelete,
  onShowMessage,
}: Props) => (
  <List
    itemLayout="horizontal"
    dataSource={data}
    renderItem={({
      approval,
      id,
      isExecuting,
      name,
      instructions,
      description,
    }) => {
      const buttonType = stopRunApproval(approval !== undefined, isExecuting);
      let button;
      console.log(approval);
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
              <Badge count={approval ? 1 : 0}>
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
      return (
        <List.Item
          key={id}
          actions={[button, <Button onClick={onDelete(id)}>Delete</Button>]}
        >
          <List.Item.Meta
            title={<a onClick={onShowMessage(id)}>{name}</a>}
            description={instructions}
          />

          <div>{description}</div>
        </List.Item>
      );
    }}
  />
);
export default BotList;
