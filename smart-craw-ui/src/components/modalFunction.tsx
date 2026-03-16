import { useState } from "react";
import type { BotOutput } from "../../../shared/models";
import { isValidCron } from "cron-validator";
import cronstrue from "cronstrue";
import { Input, Space, Typography } from "antd";
import ModalMessages from "./ModalMessages";
import type { HookAPI } from "antd/es/modal/useModal";

const { Text } = Typography;
export const isNotEmpty = (v: string | undefined | null) => {
  return !!v;
};
export const showBotModal = (
  title: string,
  modal: HookAPI,
  defaultBot: BotOutput,
  isNew: boolean,
  onUpdate: (isNew: boolean, bot: BotOutput) => void,
) => {
  let valuesRef = { ...defaultBot };
  const ModalForm = () => {
    const [{ cron, name, description, instructions }, setFormValues] =
      useState<BotOutput>(defaultBot);
    const handleChange = (key: string, value: string) => {
      setFormValues((v) => {
        const updated = { ...v, [key]: value };
        valuesRef = updated; // update ref immediately
        return updated;
      });
    };
    const isValid = isValidCron(cron || "");
    const helpText = !isNotEmpty(cron)
      ? ""
      : isValid && isNotEmpty(cron)
        ? cronstrue.toString(cron || "")
        : "Enter valid cron";
    return (
      <Space orientation="vertical" style={{ width: "100%" }}>
        <div>
          <p style={{ margin: 5 }}>Name (required)</p>
          <Input
            value={name}
            onChange={(e) => handleChange("name", e.currentTarget.value)}
          />
        </div>

        <div>
          <p style={{ margin: 5 }}>Description (required)</p>
          <Input
            value={description}
            onChange={(e) => handleChange("description", e.currentTarget.value)}
          />
        </div>
        <div>
          <p style={{ margin: 5 }}>Instructions (required)</p>
          <Input
            type="textarea"
            value={instructions}
            onChange={(e) =>
              handleChange("instructions", e.currentTarget.value)
            }
          />
        </div>
        <div>
          <p style={{ margin: 5 }}>Cron schedule (optional)</p>
          <Input
            status={isValid || !isNotEmpty(cron) ? undefined : "error"}
            value={cron}
            onChange={(e) => handleChange("cron", e.currentTarget.value)}
          />
          <Text type="secondary">{helpText}</Text>
        </div>
      </Space>
    );
  };
  return modal.confirm({
    title,
    icon: null,
    closable: true,
    width: "80%",
    content: <ModalForm />,
    onOk: () => {
      onUpdate(isNew, valuesRef);
    },
  });
};

export const showMessagesModal = (botId: string, modal: HookAPI) => {
  return modal.confirm({
    title: "Messages",
    icon: null,
    closable: true,
    width: "80%",
    content: <ModalMessages botId={botId} />,
  });
};
