import { useEffect } from "react";
import { connectWs } from "./services/ws";
import BotList from "./components/BotList";
import { Col, Row, Layout, notification, ConfigProvider } from "antd";
import MainChat from "./components/MainChat";
import { useAppStore } from "./state/store";

const { Content, Header } = Layout;

function App() {
  const notificationState = useAppStore((state) => state.notification);
  const setWs = useAppStore((state) => state.setWs);
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

  useEffect(() => {
    const wsInstance = connectWs();
    setWs(wsInstance);
    return () => {
      wsInstance.close();
    };
  }, [setWs]);

  return (
    <ConfigProvider
      theme={{
        components: {
          Collapse: {
            headerPadding: 0,
          },
        },
      }}
    >
      {contextHolder}
      <Layout style={{ minHeight: "100vh" }}>
        <Header style={{ display: "flex", alignItems: "center" }}>
          <div className="demo-logo" />
        </Header>
        <Content style={{ padding: "5px 48px" }}>
          <Row gutter={8}>
            <Col xs={24} sm={16}>
              <BotList />
            </Col>
            <Col xs={24} sm={8}>
              <MainChat />
            </Col>
          </Row>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
