import { useReducer, createContext, useState, useEffect } from "react";
import {
  connectWs,
  createBot,
  executeBot,
  getMessages,
  removeBot,
  sendApproval,
  stopBot,
} from "./services/ws";
import { botReducer, BotContext, botAction } from "./state/bot";
import { notificationReducer } from "./state/notification";
import { messageReducer, MessageContext } from "./state/message";
import BotList from "./components/BotList";
import ModalCreateBot from "./components/ModalCreateBot";
import { Button, Col, Row, Layout, Card, notification } from "antd";
import ModalListMessages from "./components/ModalListMessages";
const WsContext = createContext<WebSocket | null>(null);
const { Content, Header } = Layout;
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  //const [approvalState, approvalDispatch] = useReducer(approvalReducer, []);
  //put dispatches here
  const ws = connectWs(
    botDispatch,
    messageDispatch,
    notificationDispatch,
    //approvalDispatch,
  );
  const onConfirm = (id: string, toolName: string) => () => {
    sendApproval(ws, id, toolName);
    return botDispatch({
      id,
      approval: true,
      type: botAction.ACTIONED,
    });
  };
  const onCreate = (
    name: string,
    description: string,
    instructions: string,
  ) => {
    createBot(ws, name, description, instructions);
    setIsModalOpen(false);
  };
  const toggleModal = () => setIsModalOpen((v) => !v);
  const execute = (id: string) => () => {
    botDispatch({ type: botAction.STARTED, id });
    executeBot(ws, id);
  };
  const stopExecute = (id: string) => () => {
    stopBot(ws, id);
    botDispatch({ type: botAction.FINISHED, id });
  };
  const selectedBot = botState.find((v) => v.id === selectedId);
  useEffect(() => {
    if (selectedId && !messageState[selectedId]) {
      getMessages(ws, selectedId);
    }
  }, [selectedId, ws, messageState]);
  return (
    <WsContext value={ws}>
      <BotContext value={botState}>
        <MessageContext value={messageState}>
          {contextHolder}
          <Layout style={{ minHeight: "100vh" }}>
            <Header style={{ display: "flex", alignItems: "center" }}>
              <div className="demo-logo" />
            </Header>
            <Content style={{ padding: "5px 48px" }}>
              <ModalListMessages
                isOpen={isMessagesOpen}
                onCancel={() => {
                  setIsMessagesOpen(false);
                  setSelectedId(null);
                }}
                messages={selectedId ? messageState[selectedId] : []}
                botName={selectedBot ? selectedBot.name : ""}
              />
              <ModalCreateBot
                isOpen={isModalOpen}
                onCreate={onCreate}
                onCancel={toggleModal}
              />
              <Row>
                <Col span={16}>
                  <Card title="Bot inventory">
                    <Button onClick={toggleModal}>Add New</Button>
                    <BotList
                      onConfirm={onConfirm}
                      execute={execute}
                      stopExecute={stopExecute}
                      onDelete={(id: string) => () => {
                        removeBot(ws, id);
                        botDispatch({ type: botAction.DELETED, id });
                      }}
                      onShowMessage={(id: string) => () => {
                        setSelectedId(id);
                        setIsMessagesOpen(true);
                      }}
                      data={botState}
                    />
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
