import { List, Popconfirm, Button, Badge } from "antd";

import { botAction, BotContext } from "../state/bot";
import { useContext, useState } from "react";
import { WsContext } from "../state/ws";
import {
  executeBot,
  getMessages,
  removeBot,
  sendApproval,
  stopBot,
} from "../services/ws";
import ModalListMessages from "./ModalListMessages";

/*interface Props {

  onShowMessage: (id: string) => () => void;
}*/
const ButtonOption = {
  Approval: "approval",
  Stop: "stop",
  Run: "run",
} as const;

type LocalBot = {
  name: string;
  id: string;
};
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
const BotList: React.FC = () => {
  const { value: data, dispatch: botDispatch } = useContext(BotContext);
  const ws = useContext(WsContext)!;

  const onConfirm = (id: string, toolName: string) => () => {
    sendApproval(ws, id, toolName);
    return botDispatch({
      id,
      approved: true,
      type: botAction.ACTIONED,
    });
  };
  const execute = (id: string) => () => {
    botDispatch({ type: botAction.STARTED, id });
    executeBot(ws, id);
  };
  const stopExecute = (id: string) => () => {
    stopBot(ws, id);
    botDispatch({ type: botAction.FINISHED, id });
  };
  const onDelete = (id: string) => () => {
    removeBot(ws, id);
    botDispatch({ type: botAction.DELETED, id });
  };
  const [selectedBot, setSelectedBot] = useState<LocalBot | null>(null);

  return (
    <>
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
          const buttonType = stopRunApproval(
            approval !== undefined,
            isExecuting,
          );
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
          return (
            <List.Item
              key={id}
              actions={[button, <Button onClick={onDelete(id)}>Delete</Button>]}
            >
              <List.Item.Meta
                title={
                  <a
                    onClick={() => {
                      getMessages(ws, id);
                      setSelectedBot({ id, name });
                    }}
                  >
                    {name}
                  </a>
                }
                description={instructions}
              />

              <div>{description}</div>
            </List.Item>
          );
        }}
      />
      <ModalListMessages
        isOpen={selectedBot !== null}
        onCancel={() => {
          setSelectedBot(null);
        }}
        botName={selectedBot?.name || ""}
        botId={selectedBot?.id || ""}
      />
    </>
  );
};
export default BotList;
