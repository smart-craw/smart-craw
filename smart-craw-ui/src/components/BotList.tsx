import { Button, Card, App, Descriptions, Space, Alert } from "antd";
import cronstrue from "cronstrue";
import { useAppStore } from "../state/store";
import {
  createBot,
  executeBot,
  getMessages,
  removeBot,
  sendBotApprovalDecision,
  stopBot,
} from "../services/ws";
import LlmActionButton from "./LlmAction";
import {
  CommentOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { isNotEmpty, showBotModal, showMessagesModal } from "./modalFunction";
import type { BotOutput } from "../../../shared/models";
const { Meta } = Card;
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
  const onDecision =
    (id: string, toolName: string, approved: boolean) => () => {
      sendBotApprovalDecision(ws, id, toolName, approved);
      return actionBotApproval(id, approved);
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
    finishBot(id, true);
  };
  const onDelete = (id: string) => () => {
    removeBot(ws, id);
    deleteBot(id);
  };
  const { modal } = App.useApp();
  return (
    <>
      <Card title="Bot Inventory">
        <Space vertical>
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
          {data.map(
            ({
              approval,
              id,
              isExecuting,
              name,
              instructions,
              description,
              isSuccess,
              cron,
            }) => {
              return (
                <Card
                  key={id}
                  size="small"
                  actions={[
                    <LlmActionButton
                      approval={approval}
                      id={id}
                      isExecuting={isExecuting}
                      onDecision={onDecision}
                      execute={execute}
                      stopExecute={stopExecute}
                    />,
                    <CommentOutlined
                      onClick={() => {
                        getMessages(ws, id);
                        showMessagesModal(id, modal);
                      }}
                    />,
                    <EditOutlined
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
                    />,
                    <DeleteOutlined onClick={onDelete(id)} />,
                  ]}
                >
                  <Meta
                    title={name}
                    description={`${description}${
                      cron
                        ? `. Runs ${lowerFirstLetter(cronstrue.toString(cron))}.`
                        : ""
                    }`}
                  />
                  <Descriptions
                    style={{ marginTop: 8 }}
                    items={[{ label: "Instructions", children: instructions }]}
                  />
                  {isSuccess !== undefined && !isSuccess && (
                    <Alert title="Unexpected error" type="error" />
                  )}
                </Card>
              );
            },
          )}
        </Space>
      </Card>
    </>
  );
};
export default BotList;
