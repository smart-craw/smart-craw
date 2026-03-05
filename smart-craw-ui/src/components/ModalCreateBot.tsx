import React from "react";
import { Modal, Form, Input } from "antd";

type BotCreateModal = {
  name: string;
  description: string;
  instructions: string;
};
interface Props {
  isOpen: boolean;
  onCreate: (name: string, description: string, instructions: string) => void;
  onCancel: () => void;
}
const ModalCreateBot: React.FC<Props> = ({ isOpen, onCreate, onCancel }) => {
  const [form] = Form.useForm();
  //const [formValues, setFormValues] = useState<FieldType>();
  const onFormSubmit = ({
    name,
    description,
    instructions,
  }: BotCreateModal) => {
    onCreate(name, description, instructions);
  };
  return (
    <>
      <Modal
        title="New Bot"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isOpen}
        okText="Create"
        cancelText="Cancel"
        okButtonProps={{ autoFocus: true, htmlType: "submit" }}
        onCancel={onCancel}
        modalRender={(dom) => (
          <Form
            layout="vertical"
            form={form}
            name="form_in_modal"
            initialValues={{ modifier: "public" }}
            clearOnDestroy
            onFinish={(values) => onFormSubmit(values)}
          >
            {dom}
          </Form>
        )}
      >
        <Form.Item
          name="name"
          label="Bot Name"
          rules={[
            {
              required: true,
              message: "Please input the name of the Bot!",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description of the Bot"
          rules={[
            {
              required: true,
              message: "Please input the description for the Bot!",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="instructions"
          label="Instructions for the Bot"
          rules={[
            {
              required: true,
              message: "Please input the instructions for the Bot!",
            },
          ]}
        >
          <Input type="textarea" />
        </Form.Item>
      </Modal>
    </>
  );
};

export default ModalCreateBot;
