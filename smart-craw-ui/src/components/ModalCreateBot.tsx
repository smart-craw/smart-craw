import React, { useState } from "react";
import { Modal, Form, Input } from "antd";
import { isValidCron } from "cron-validator";
type BotCreateModal = {
  name: string;
  description: string;
  instructions: string;
  cron?: string;
};
interface Props {
  isOpen: boolean;
  onCreate: (
    name: string,
    description: string,
    instructions: string,
    cron?: string,
  ) => void;
  onCancel: () => void;
}
const ModalCreateBot: React.FC<Props> = ({ isOpen, onCreate, onCancel }) => {
  const [form] = Form.useForm();
  const onFormSubmit = ({
    name,
    description,
    instructions,
    cron,
  }: BotCreateModal) => {
    onCreate(name, description, instructions, cron);
  };
  const [cron, setCron] = useState("");
  const isValid = isValidCron(cron);
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
        <Form.Item
          name="cron"
          label="Cron schedule (optional)"
          validateStatus={isValid ? "success" : "error"}
          help={"Enter valid cron"}
          rules={[
            {
              required: false,
              message: "Only required if you want to schedule",
            },
          ]}
        >
          <Input
            value={cron}
            onChange={(e) => setCron(e.currentTarget.value)}
          />
        </Form.Item>
      </Modal>
    </>
  );
};

export default ModalCreateBot;
