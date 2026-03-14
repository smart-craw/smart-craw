import { List, Modal, Button } from "antd";
import { useAppStore } from "../state/store";

interface Props {
  isOpen: boolean;
  onCancel: () => void;
  botName: string;
  botId: string;
}
const ModalListMessages = ({ isOpen, onCancel, botName, botId }: Props) => {
  const messagesByBot = useAppStore((state) => state.messages);
  const messages = messagesByBot[botId] || [];

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
