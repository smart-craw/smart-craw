import React, { useState } from "react";
import { Card, Space, Button, Descriptions, Flex } from "antd";
//import LlmActionButton from "./LlmAction";
import { converseLlm, sendLlmApproval, stopBot } from "../services/ws";
import { useAppStore } from "../state/store";
import { Think, Sender, ThoughtChain } from "@ant-design/x";
import { XMarkdown } from "@ant-design/x-markdown";
import { CodeOutlined } from "@ant-design/icons";

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
    //setCommand("");
    converseLlm(ws, id, command);
    startLlm();
  };
  const stopExecute = (id: string) => () => {
    stopBot(ws, id); //works on LLM as well
    finishLlm("");
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
            //This goes a way as soon as "approve" is hit.  Need to modify this so there is feedback
            // ...eh...this may be the right behavior
            items={[
              {
                key: "toolcall",
                title: approval.toolName,
                //description: JSON.stringify(approval.input),
                icon: <CodeOutlined />,
                footer: (
                  <Flex gap="small" vertical>
                    <Descriptions
                      column={1}
                      //title="Tool info"
                      items={Object.entries<string>(approval.input).map(
                        ([key, value]) => ({
                          key,
                          label: key,
                          children: value,
                        }),
                      )}
                    />
                    <Flex gap="small" wrap>
                      <Button
                        type="primary"
                        onClick={onConfirm(id, approval.toolName)}
                      >
                        Approve
                      </Button>
                      <Button danger>Deny</Button>
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
//<Collapse ghost items={items} />
export default MainChat;
//     <Text style={{ paddingTop: 5 }}>{message}</Text>
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

/*<TextArea
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
/> */
