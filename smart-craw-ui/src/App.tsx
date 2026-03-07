import { useReducer, useState, useEffect } from "react";
import { connectWs, createBot } from "./services/ws";
import { botReducer, BotContext } from "./state/bot";
import { notificationReducer } from "./state/notification";
import { messageReducer, MessageContext } from "./state/message";
import BotList from "./components/BotList";
import ModalCreateBot from "./components/ModalCreateBot";
import { Button, Col, Row, Layout, Card, notification } from "antd";
import { WsContext } from "./state/ws";
const { Content, Header } = Layout;
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [botState, botDispatch] = useReducer(botReducer, []);
  const [messageState, messageDispatch] = useReducer(messageReducer, {});
  const [notificationState, notificationDispatch] = useReducer(
    notificationReducer,
    null,
  );

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

  const ws = connectWs(botDispatch, messageDispatch, notificationDispatch);

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
    <WsContext value={ws}>
      <BotContext value={{ value: botState, dispatch: botDispatch }}>
        <MessageContext
          value={{ value: messageState, dispatch: messageDispatch }}
        >
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
              <Row>
                <Col span={16}>
                  <Card title="Bot inventory">
                    <Button onClick={toggleModal}>Add New</Button>
                    <BotList />
                  </Card>
                </Col>
              </Row>
            </Content>
          </Layout>
        </MessageContext>
      </BotContext>
    </WsContext>
  );
}

export default App;
