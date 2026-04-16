import React, { useState } from "react";
import { Card, Space, Button, Flex, Tag } from "antd";
import { converseLlm, sendLlmApprovalDecision, stopBot } from "../services/ws";
import { useAppStore } from "../state/store";
import { Think, Sender, ThoughtChain } from "@ant-design/x";
import { XMarkdown } from "@ant-design/x-markdown";
import { CodeOutlined, SyncOutlined } from "@ant-design/icons";
import ApprovalDescription from "./ApprovalDescription";

const MainChat: React.FC = () => {
  const ws = useAppStore((state) => state.ws)!;

  const [command, setCommand] = useState("");
  const llmState = useAppStore((state) => state.llm);
  const actionLlmApproval = useAppStore((state) => state.actionLlmApproval);
  const startLlm = useAppStore((state) => state.startLlm);
  const finishLlm = useAppStore((state) => state.finishLlm);
  const setMessages = useAppStore((state) => state.setMessages);
  const messagesByBot = useAppStore((state) => state.messages);
  const { id, approval, isExecuting } = llmState;
  const messages = messagesByBot[id] || [];
  const onDecision =
    (id: string, toolName: string, approved: boolean) => () => {
      sendLlmApprovalDecision(ws, id, toolName, approved);
      return actionLlmApproval(approved);
    };

  const execute = (id: string) => () => {
    converseLlm(ws, id, command);
    startLlm();
    //reset messages on first/next execute
    setMessages(id, []);
  };
  const stopExecute = (id: string) => () => {
    stopBot(ws, id); //works on LLM as well
    finishLlm(true);
  };
  console.log(messages);
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
        {messages.map(({ reasoning, message, isTool }, index, arr) => {
          return isTool ? (
            <Tag
              key={index}
              icon={
                <SyncOutlined spin={index === arr.length - 1 ? true : false} />
              }
              variant="outlined"
            >
              {message}
            </Tag>
          ) : (
            <div key={index}>
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
            </div>
          );
        })}
      </Space>
    </Card>
  );
};
export default MainChat;
