import { useReducer, useState, useEffect } from "react";
import { connectWs, createBot } from "./services/ws";
import { botReducer, BotContext } from "./state/bot";
import { notificationReducer } from "./state/notification";
import { messageReducer, MessageContext } from "./state/message";
import BotList from "./components/BotList";
import ModalCreateBot from "./components/ModalCreateBot";
import { Col, Row, Layout, notification, ConfigProvider } from "antd";
import { WsContext } from "./state/ws";
import MainChat from "./components/MainChat";
import { LlmContext, llmReducer, dummyLlm } from "./state/llm";
const { Content, Header } = Layout;

function App() {
  const [botState, botDispatch] = useReducer(botReducer, []);
  const [messageState, messageDispatch] = useReducer(messageReducer, {});
  const [notificationState, notificationDispatch] = useReducer(
    notificationReducer,
    null,
  );
  const [llmState, llmDispatch] = useReducer(llmReducer, dummyLlm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [api, contextHolder] = notification.useNotification({
    stack: {
      threshold: 3,
    },
  });
  useEffect(() => {
    if (notificationState !== null) {
      api.open({
        title: notificationState?.notificationType,
        description: notificationState?.message,
        duration: false,
      });
    }
  }, [notificationState, api]);

  const ws = connectWs(
    botDispatch,
    messageDispatch,
    notificationDispatch,
    llmDispatch,
  );

  const onCreate = (
    name: string,
    description: string,
    instructions: string,
  ) => {
    createBot(ws, name, description, instructions);
    setIsModalOpen(false);
  };
  const toggleModal = () => setIsModalOpen((v) => !v);

  return (
    <ConfigProvider
      theme={{
        components: {
          Collapse: {
            //borderlessContentPadding: 0,
            headerPadding: 0,
          },
        },
      }}
    >
      <WsContext value={ws}>
        <BotContext value={{ value: botState, dispatch: botDispatch }}>
          <MessageContext
            value={{ value: messageState, dispatch: messageDispatch }}
          >
            <LlmContext value={{ value: llmState, dispatch: llmDispatch }}>
              {contextHolder}
              <Layout style={{ minHeight: "100vh" }}>
                <Header style={{ display: "flex", alignItems: "center" }}>
                  <div className="demo-logo" />
                </Header>
                <Content style={{ padding: "5px 48px" }}>
                  <ModalCreateBot
                    isOpen={isModalOpen}
                    onCreate={onCreate}
                    onCancel={toggleModal}
                  />
                  <Row gutter={8}>
                    <Col xs={24} sm={16}>
                      <BotList onCreateBot={toggleModal} />
                    </Col>
                    <Col xs={24} sm={8}>
                      <MainChat />
                    </Col>
                  </Row>
                </Content>
              </Layout>
            </LlmContext>
          </MessageContext>
        </BotContext>
      </WsContext>
    </ConfigProvider>
  );
}

export default App;
