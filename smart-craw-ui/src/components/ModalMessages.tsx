import { List } from "antd";
import { useAppStore } from "../state/store";

const ModalMessages = ({ botId }: { botId: string }) => {
  console.log(botId);
  const messagesByBot = useAppStore((state) => state.messages);
  const bots = useAppStore((state) => state.bots);
  const messages = messagesByBot[botId] || [];
  console.log(messages);
  console.log(bots);
  const selectedBot = bots.find((v) => v.id === botId);
  console.log(selectedBot);
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
          <div>{message.message}</div>
        </List.Item>
      )}
    />
  );
};
export default ModalMessages;
