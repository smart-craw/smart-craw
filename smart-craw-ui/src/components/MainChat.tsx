import React, { useState } from "react";
import { Card, Space, Tag } from "antd";
import { clearLlmSession, converseLlm, stopBot } from "../services/ws";
import { useAppStore } from "../state/store";
import { Think, Sender } from "@ant-design/x";
import { XMarkdown } from "@ant-design/x-markdown";
import { SyncOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { ClearOutlined } from "@ant-design/icons";

const MainChat: React.FC = () => {
  const ws = useAppStore((state) => state.ws)!;
  const [command, setCommand] = useState("");
  const llmState = useAppStore((state) => state.llm);
  const startLlm = useAppStore((state) => state.startLlm);
  const finishLlm = useAppStore((state) => state.finishLlm);
  const setMessages = useAppStore((state) => state.setMessages);
  const messagesByBot = useAppStore((state) => state.messages);
  const { id, isExecuting } = llmState;
  const messages = messagesByBot[id] || [];
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
  const clearSession = (id: string) => {
    setMessages(id, []);
    clearLlmSession(ws);
  };
  return (
    <Card title="Bot Playground">
      <Space orientation="vertical" style={{ width: "100%" }}>
        <Button
          type="primary"
          onClick={() => clearSession(id)}
          icon={<ClearOutlined />}
        >
          Clear Session
        </Button>
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
          const isLast = index === arr.length - 1;
          return isTool ? (
            <Tag
              key={index}
              icon={<SyncOutlined spin={isLast} />}
              variant="outlined"
            >
              {message}
            </Tag>
          ) : (
            <div key={index}>
              <Think loading={isExecuting && isLast} title="Show thinking">
                {reasoning}
              </Think>

              <XMarkdown content={message} />
            </div>
          );
        })}
      </Space>
    </Card>
  );
};
export default MainChat;
