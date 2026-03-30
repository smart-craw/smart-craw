import { DownOutlined, MutedOutlined } from "@ant-design/icons";
import { Button, Dropdown, Switch, Tooltip, type MenuProps } from "antd";
import { useAppStore } from "../state/store";
import { useState } from "react";

const SettingsButton = () => {
  const { coneOfSilence, ...rest } = useAppStore((state) => state.settings);
  const setSettings = useAppStore((state) => state.setSettings);
  const [isOpen, setIsOpen] = useState(false);
  const menuDropDown: MenuProps["items"] = [
    {
      label: (
        <Tooltip title="Toggle notifications">
          Cone of Silence <Switch value={coneOfSilence} />
        </Tooltip>
      ),
      key: "1",
      icon: <MutedOutlined />,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        setSettings({ ...rest, coneOfSilence: !coneOfSilence });
      },
    },
  ];
  return (
    <Dropdown
      open={isOpen}
      menu={{
        items: menuDropDown,
      }}
      onOpenChange={(open, { source }) => {
        if (source === "trigger" || (open === false && source !== "menu")) {
          setIsOpen(open);
        }
      }}
    >
      <Button icon={<DownOutlined />} iconPlacement="end">
        Options
      </Button>
    </Dropdown>
  );
};

export default SettingsButton;
