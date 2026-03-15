import { List, Button, Card } from "antd";
import cronstrue from "cronstrue";
import { useState } from "react";
import { useAppStore } from "../state/store";
import {
  executeBot,
  getMessages,
  removeBot,
  sendBotApproval,
  stopBot,
} from "../services/ws";
import ModalListMessages from "./ModalListMessages";
import LlmActionButton from "./LlmAction";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

type LocalBot = {
  name: string;
  id: string;
};

type Props = {
  onCreateBot: () => void;
};
const lowerFirstLetter = (v: string) => {
  return v ? v.charAt(0).toLowerCase() + v.slice(1) : v;
};
const BotList: React.FC<Props> = ({ onCreateBot }: Props) => {
  const data = useAppStore((state) => state.bots);
  const ws = useAppStore((state) => state.ws)!;
  const actionBotApproval = useAppStore((state) => state.actionBotApproval);
  const startBot = useAppStore((state) => state.startBot);
  const finishBot = useAppStore((state) => state.finishBot);
  const deleteBot = useAppStore((state) => state.deleteBot);

  //
  const onConfirm = (id: string, toolName: string) => () => {
    sendBotApproval(ws, id, toolName);
    return actionBotApproval(id, true);
  };
  const execute = (id: string) => () => {
    startBot(id);
    executeBot(ws, id);
  };
  const stopExecute = (id: string) => () => {
    stopBot(ws, id);
    finishBot(id);
  };
  const onDelete = (id: string) => () => {
    removeBot(ws, id);
    deleteBot(id);
  };
  const [selectedBot, setSelectedBot] = useState<LocalBot | null>(null);
  const editModal = (id: string) => () => {
    console.log("got here");
  };
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
          cron,
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
                <Button onClick={onDelete(id)} icon={<DeleteOutlined />} />,
                <Button onClick={editModal(id)} icon={<EditOutlined />} />,
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

              <div>
                {description}
                {cron
                  ? `. Runs ${lowerFirstLetter(cronstrue.toString(cron))}.`
                  : ""}
              </div>
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
