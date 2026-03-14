import React, { useState } from "react";
import { Input, Card, Space, Collapse, Typography } from "antd";
import LlmActionButton from "./LlmAction";
import { converseLlm, sendLlmApproval, stopBot } from "../services/ws";
import { useAppStore } from "../state/store";

const { TextArea } = Input;
const { Text } = Typography;
const MainChat: React.FC = () => {
  const ws = useAppStore((state) => state.ws)!;

  const [command, setCommand] = useState("");
  const llmState = useAppStore((state) => state.llm);
  const actionLlmApproval = useAppStore((state) => state.actionLlmApproval);
  const startLlm = useAppStore((state) => state.startLlm);
  const finishLlm = useAppStore((state) => state.finishLlm);
  const messagesByBot = useAppStore((state) => state.messages);
  
  const { id, approval, isExecuting } = llmState;
  const messages = messagesByBot[id] || [];
  const { reasoning, message } =
    messages.length > 0
      ? messages[messages.length - 1]
      : { reasoning: "", message: "" };
  //console.log(llmState);
  const onConfirm = (id: string, toolName: string) => () => {
    sendLlmApproval(ws, id, toolName);
    return actionLlmApproval(true);
  };
  const execute = (id: string) => () => {
    converseLlm(ws, id, command);
    startLlm();
  };
  const stopExecute = (id: string) => () => {
    stopBot(ws, id); //works on LLM as well
    finishLlm("");
  };
  const items = [
    {
      key: "1",
      label: "Show thinking",
      children: <Text type="secondary">{reasoning}</Text>,
    },
  ];
  return (
    <Card title="Bot Playground">
      <Space orientation="vertical" style={{ width: "100%" }}>
        <TextArea
          rows={4}
          placeholder="Instructions"
          onChange={(e) => {
            setCommand(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              //won't propogate to onChange
              e.preventDefault();
            }
          }}
          onPressEnter={execute(id)}
        />
        <LlmActionButton
          id={id}
          approval={approval}
          isExecuting={isExecuting}
          onConfirm={onConfirm}
          execute={execute}
          stopExecute={stopExecute}
        />
        <Collapse ghost items={items} />
        <Text style={{ paddingTop: 5 }}>{message}</Text>
      </Space>
    </Card>
  );
};

export default MainChat;

/*<Row gutter={[0, 8]}>
  <Col span={24}>
    <TextArea
      rows={4}
      placeholder="Instructions"
      onChange={(e) => setCommand(e.target.value)}
      onPressEnter={execute(id)}
    />
  </Col>
  <Col span={24}>
    <LlmActionButton
      id={id}
      approval={approval}
      isExecuting={isExecuting}
      onConfirm={onConfirm}
      execute={execute}
      stopExecute={stopExecute}
    />
  </Col>
  <Col span={24}>
    <Card title="Result">
      <Collapse ghost items={items} />
      <Text style={{ paddingTop: 5 }}>{message}</Text>
    </Card>
  </Col>
</Row> */
