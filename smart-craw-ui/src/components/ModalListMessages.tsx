import { List, Modal, Button } from "antd";
import type { Message } from "../state/message";

interface Props {
  isOpen: boolean;
  onCancel: () => void;
  messages: Message[];
  botName: string;
}
const ModalListMessages = ({ isOpen, onCancel, messages, botName }: Props) => {
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
