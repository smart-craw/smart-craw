import React, { useContext, useState } from "react";
import { Input, Form, Card } from "antd";
import LlmActionButton from "./LlmAction";
import { WsContext } from "../state/ws";
import { converseLlm, sendLlmApproval, stopBot } from "../services/ws";
import { llmAction, LlmContext } from "../state/llm";

const { TextArea } = Input;
type FieldType = {
  command: string;
};

const MainChat: React.FC = () => {
  const ws = useContext(WsContext)!;
  const [command, setCommand] = useState("");
  const { value: llmState, dispatch: llmDispatch } = useContext(LlmContext);
  const { id, approval, isExecuting, result } = llmState;
  console.log(llmState);
  const onConfirm = (id: string, toolName: string) => () => {
    sendLlmApproval(ws, id, toolName);
    return llmDispatch({
      id,
      approved: true,
      type: llmAction.ACTIONED,
    });
  };
  const execute = (id: string) => () => {
    converseLlm(ws, id, command);
    llmDispatch({
      type: llmAction.STARTED,
    });
  };
  const stopExecute = (id: string) => () => {
    stopBot(ws, id); //works on LLM as well
    llmDispatch({ type: llmAction.FINISHED });
  };

  return (
    <>
      <Form
        name="instructions"
        //labelCol={{ span: 8 }}
        wrapperCol={{ span: 24 }}
        //style={{ maxWidth: 600 }}
        //initialValues={{ remember: true }}
        /*onFinish={({ command }) => {
          converseLlm(ws, id, command);
          llmDispatch({
            type: llmAction.STARTED,
          });
          }}*/
        //onFinishFailed={onFinishFailed}
        //autoComplete="off"
      >
        <Form.Item<FieldType>
          //label="Instructions"
          name="command"
          rules={[{ required: true, message: "Submit command" }]}
        >
          <TextArea
            rows={4}
            placeholder="Instructions"
            onChange={(e) => setCommand(e.target.value)}
            onPressEnter={execute(id)}
          />
        </Form.Item>
        <Form.Item>
          <LlmActionButton
            id={id}
            approval={approval}
            isExecuting={isExecuting}
            onConfirm={onConfirm}
            execute={execute}
            stopExecute={stopExecute}
          />
        </Form.Item>
      </Form>
      <Card title="Result">{result}</Card>
    </>
  );
};

export default MainChat;
