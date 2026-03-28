import { List } from "antd";
import { useAppStore } from "../state/store";
import { XMarkdown } from "@ant-design/x-markdown";
const ModalMessages = ({ botId }: { botId: string }) => {
  const messagesByBot = useAppStore((state) => state.messages);
  const bots = useAppStore((state) => state.bots);
  const messages = messagesByBot[botId] || [];
  const selectedBot = bots.find((v) => v.id === botId);
  const botName = (selectedBot || { name: "" }).name;
  return (
    <List
      itemLayout="vertical"
      dataSource={messages}
      renderItem={(message) => (
        <List.Item key={message.id}>
          <List.Item.Meta
            title={`${botName}-${message.timestamp.toISOString()}`}
            description={message.reasoning}
          />
          <XMarkdown content={message.message} />
        </List.Item>
      )}
    />
  );
};
export default ModalMessages;
