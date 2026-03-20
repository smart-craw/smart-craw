import { useState } from "react";
import type { BotOutput } from "../../../shared/models";
import { isValidCron } from "cron-validator";
import cronstrue from "cronstrue";
import { Space } from "antd";
import ModalMessages from "./ModalMessages";
import FormItem from "./ModalForm";
import type { HookAPI } from "antd/es/modal/useModal";

export const isNotEmpty = (v: string | undefined | null) => {
  return !!v;
};

const nonEmptyHelpText = (field: string) => `${field} is required`;
export const checkValuesAreValid = (bot: BotOutput) => {
  if (isNotEmpty(bot.cron) && !isValidCron(bot.cron || "")) {
    return false;
  }
  return Object.entries(bot)
    .filter(([key, _value]) => key !== "cron" && key !== "id") //cron dealt with seperately
    .reduce((aggr, [_key, value]) => {
      return aggr && isNotEmpty(value);
    }, true);
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
        <FormItem
          title="Name (required)"
          helpText={isNotEmpty(name) ? "" : nonEmptyHelpText("Name")}
          status={isNotEmpty(name) ? undefined : "error"}
          value={name}
          onChange={(e) => handleChange("name", e.currentTarget.value)}
        />
        <FormItem
          title="Description (required)"
          helpText={
            isNotEmpty(description) ? "" : nonEmptyHelpText("Description")
          }
          status={isNotEmpty(description) ? undefined : "error"}
          value={description}
          onChange={(e) => handleChange("description", e.currentTarget.value)}
        />
        <FormItem
          title="Instructions (required)"
          type="textarea"
          helpText={
            isNotEmpty(instructions) ? "" : nonEmptyHelpText("Instructions")
          }
          status={isNotEmpty(instructions) ? undefined : "error"}
          value={instructions}
          onChange={(e) => handleChange("instructions", e.currentTarget.value)}
        />
        <FormItem
          title="Cron schedule (optional)"
          helpText={helpText}
          status={isValid || !isNotEmpty(cron) ? undefined : "error"}
          value={cron}
          onChange={(e) => handleChange("cron", e.currentTarget.value)}
        />
      </Space>
    );
  };

  return modal.confirm({
    title,
    icon: null,
    closable: true,
    width: "80%",
    content: <ModalForm />,
    onOk: () =>
      new Promise<void>((res, rej) => {
        if (checkValuesAreValid(valuesRef)) {
          onUpdate(isNew, valuesRef);
          res();
        } else {
          rej(); //won't let modal close if not valid
        }
      }),
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
