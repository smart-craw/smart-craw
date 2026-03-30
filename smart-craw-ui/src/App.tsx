import { useEffect } from "react";
import { connectWs } from "./services/ws";
import BotList from "./components/BotList";
import smartCrawImg from "./assets/smart_craw_crab_only.svg";
import {
  Col,
  Row,
  Layout,
  notification,
  ConfigProvider,
  App as AntApp,
} from "antd";
import MainChat from "./components/MainChat";
import { useAppStore } from "./state/store";
import SettingsButton from "./components/Settings";

const { Content, Header } = Layout;

function App() {
  const notificationState = useAppStore((state) => state.notification);
  const setWs = useAppStore((state) => state.setWs);
  const { coneOfSilence } = useAppStore((state) => state.settings);
  const [api, contextHolder] = notification.useNotification({
    stack: {
      threshold: 3,
    },
  });
  useEffect(() => {
    if (notificationState !== null && !coneOfSilence) {
      api.open({
        title: notificationState?.notificationType,
        description: notificationState?.message,
        duration: false,
      });
    }
  }, [notificationState, api, coneOfSilence]);

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
      <AntApp>
        {contextHolder}
        <Layout style={{ minHeight: "100vh" }}>
          <Header style={{ display: "flex", alignItems: "center" }}>
            <img style={{ height: "100%" }} src={smartCrawImg} />
            <div style={{ marginLeft: "auto" }}>
              <SettingsButton />
            </div>
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
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
