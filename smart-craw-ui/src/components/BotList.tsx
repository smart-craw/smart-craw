import { List, Button, Card, App } from "antd";
import cronstrue from "cronstrue";
import { useAppStore } from "../state/store";
import {
  createBot,
  executeBot,
  getMessages,
  removeBot,
  sendBotApproval,
  stopBot,
} from "../services/ws";
import LlmActionButton from "./LlmAction";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { isNotEmpty, showBotModal, showMessagesModal } from "./modalFunction";
import type { BotOutput } from "../../../shared/models";

const lowerFirstLetter = (v: string) => {
  return v ? v.charAt(0).toLowerCase() + v.slice(1) : v;
};

const BotList: React.FC = () => {
  const data = useAppStore((state) => state.bots);
  const ws = useAppStore((state) => state.ws)!;
  const actionBotApproval = useAppStore((state) => state.actionBotApproval);
  const startBot = useAppStore((state) => state.startBot);
  const finishBot = useAppStore((state) => state.finishBot);
  const deleteBot = useAppStore((state) => state.deleteBot);

  const onConfirm = (id: string, toolName: string) => () => {
    sendBotApproval(ws, id, toolName);
    return actionBotApproval(id, true);
  };
  const onCreate = (isNew: boolean, bot: BotOutput) => {
    const { id, name, description, instructions, cron } = bot;
    //will update in place if ID exists already
    createBot(
      ws,
      name,
      description,
      instructions,
      isNotEmpty(cron) ? cron : undefined, //only put in cron if it truly exists
      isNew ? undefined : id,
    );
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
  const { modal } = App.useApp();
  return (
    <>
      <Card title="Bot Inventory">
        <Button
          onClick={() =>
            showBotModal(
              "Create Bot",
              modal,
              {
                id: "",
                name: "",
                instructions: "",
                description: "",
                cron: undefined,
              },
              true,
              onCreate,
            )
          }
        >
          Add New
        </Button>
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
                  <Button
                    onClick={() => {
                      showBotModal(
                        "Edit Bot",
                        modal,
                        {
                          id,
                          name,
                          instructions,
                          description,
                          cron,
                        },
                        false,
                        onCreate,
                      );
                    }}
                    icon={<EditOutlined />}
                  />,
                ]}
              >
                <List.Item.Meta
                  title={
                    <a
                      onClick={() => {
                        getMessages(ws, id);
                        showMessagesModal(id, modal);
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
      </Card>
    </>
  );
};
export default BotList;
