import { List, Button, Card } from "antd";

import { botAction, BotContext } from "../state/bot";
import { useContext, useState } from "react";
import { WsContext } from "../state/ws";
import {
  executeBot,
  getMessages,
  removeBot,
  sendBotApproval,
  stopBot,
} from "../services/ws";
import ModalListMessages from "./ModalListMessages";
import LlmActionButton from "./LlmAction";

type LocalBot = {
  name: string;
  id: string;
};

type Props = {
  onCreateBot: () => void;
};

const BotList: React.FC<Props> = ({ onCreateBot }: Props) => {
  const { value: data, dispatch: botDispatch } = useContext(BotContext);
  const ws = useContext(WsContext)!;
  //
  const onConfirm = (id: string, toolName: string) => () => {
    sendBotApproval(ws, id, toolName);
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
  //
  return (
    <Card title="Bot Inventory">
      <Button onClick={onCreateBot}>Add New</Button>
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
          return (
            <List.Item
              key={id}
              actions={[
                <LlmActionButton
                  approval={approval}
                  id={id}
                  isExecuting={isExecuting}
                  onConfirm={onConfirm}
                  execute={execute}
                  stopExecute={stopExecute}
                />,
                <Button onClick={onDelete(id)}>Delete</Button>,
              ]}
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
    </Card>
  );
};
export default BotList;
