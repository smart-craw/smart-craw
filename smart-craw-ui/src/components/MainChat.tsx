import React, { useState } from "react";
import { Card, Space, Button, Flex } from "antd";
import { converseLlm, sendLlmApprovalDecision, stopBot } from "../services/ws";
import { useAppStore } from "../state/store";
import { Think, Sender, ThoughtChain } from "@ant-design/x";
import { XMarkdown } from "@ant-design/x-markdown";
import { CodeOutlined } from "@ant-design/icons";
import ApprovalDescription from "./ApprovalDescription";

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
  const onDecision =
    (id: string, toolName: string, approved: boolean) => () => {
      sendLlmApprovalDecision(ws, id, toolName, approved);
      return actionLlmApproval(approved);
    };

  const execute = (id: string) => () => {
    converseLlm(ws, id, command);
    startLlm();
  };
  const stopExecute = (id: string) => () => {
    stopBot(ws, id); //works on LLM as well
    finishLlm(true);
  };
  return (
    <Card title="Bot Playground">
      <Space orientation="vertical" style={{ width: "100%" }}>
        <Sender
          loading={isExecuting}
          value={command}
          onChange={(v) => {
            setCommand(v);
          }}
          onSubmit={execute(id)}
          onCancel={stopExecute(id)}
          autoSize={{ minRows: 4, maxRows: 6 }}
        />
        <Think loading={isExecuting} title="Show thinking">
          {reasoning}
        </Think>
        {approval && (
          <ThoughtChain
            items={[
              {
                key: "toolcall",
                title: approval.toolName,
                icon: <CodeOutlined />,
                footer: (
                  <Flex gap="small" vertical>
                    <ApprovalDescription input={approval.input} />
                    <Flex gap="small" wrap>
                      <Button
                        type="primary"
                        onClick={onDecision(id, approval.toolName, true)}
                      >
                        Approve
                      </Button>
                      <Button
                        danger
                        onClick={onDecision(id, approval.toolName, false)}
                      >
                        Deny
                      </Button>
                    </Flex>
                  </Flex>
                ),
              },
            ]}
          />
        )}
        <XMarkdown content={message} />
      </Space>
    </Card>
  );
};
export default MainChat;
