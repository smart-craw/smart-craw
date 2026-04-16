import { Card, Space, Tag } from "antd";
import { useAppStore } from "../state/store";
import { XMarkdown } from "@ant-design/x-markdown";
import { Think } from "@ant-design/x";
import { SyncOutlined } from "@ant-design/icons";
const ModalMessages = ({ botId }: { botId: string }) => {
  const messagesByBot = useAppStore((state) => state.messages);
  const bots = useAppStore((state) => state.bots);
  const messages = messagesByBot[botId] || [];
  const selectedBot = bots.find((v) => v.id === botId);
  const botExecuting = selectedBot?.isExecuting || false;
  const botName = selectedBot?.name || "";
  return (
    <Space vertical>
      {messages.map(({ id, timestamp, reasoning, message }) => {
        return (
          <Card
            key={id}
            size="small"
            title={`${botName}-${timestamp.toISOString()}`}
          >
            <Think loading={botExecuting} title="Show thinking">
              {reasoning}
            </Think>
            <XMarkdown content={message} />
          </Card>
        );
      })}
    </Space>
  );
};
export default ModalMessages;
