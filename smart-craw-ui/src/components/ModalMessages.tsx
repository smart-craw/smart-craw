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

/*
interface Props {
  isOpen: boolean;
  onCancel: () => void;
  //botName: string;
  botId: string;
}
const ModalListMessages = ({ isOpen, onCancel, botId }: Props) => {
  const messagesByBot = useAppStore((state) => state.messages);
  const bots = useAppStore((state) => state.bots);
  const messages = messagesByBot[botId] || [];
  const botName = (bots.find((v) => v.id === botId) || { name: "" }).name;
  return (
    <Modal
      title="Messages"
      open={isOpen}
      onOk={onCancel}
      onCancel={onCancel}
      footer={[
        <Button key="ok" type="primary" onClick={onCancel}>
          Ok
        </Button>,
      ]}
    >
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
    </Modal>
  );
};
export default ModalListMessages;
*/
