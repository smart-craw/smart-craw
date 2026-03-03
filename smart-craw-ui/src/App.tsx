import { useReducer, createContext, useState } from "react";
//import reactLogo from "./assets/react.svg";
//import viteLogo from "/vite.svg";
import "./App.css";
import { connectWs } from "./services/ws";
import { botReducer } from "./state/bot";
import { notificationReducer } from "./state/notification";
//import { approvalReducer } from "./state/approval";
import { messageReducer } from "./state/message";
import BotList from "./components/BotList";
import type { BotCreateModal } from "./components/ModalCreateBot";
import ModalCreateBot from "./components/ModalCreateBot";
import { Button } from "antd";
const WsContext = createContext<WebSocket | null>(null);
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [botState, botDispatch] = useReducer(botReducer, []);
  const [messageState, messageDispatch] = useReducer(messageReducer, {});
  const [notificationState, notificationDispatch] = useReducer(
    notificationReducer,
    [],
  );

  //const [approvalState, approvalDispatch] = useReducer(approvalReducer, []);
  //put dispatches here
  const ws = connectWs(
    botDispatch,
    messageDispatch,
    notificationDispatch,
    //approvalDispatch,
  );
  const onConfirm = (id: string, toolName: string) => () => {
    ws.send(
      JSON.stringify({
        path: "/tool/approval",
        input: { approved: true, toolName, id },
      }),
    );
    return botDispatch({
      id,
      approval: null,
      type: "actioned",
    });
  };
  const onCreate = ({ description, instructions, name }: BotCreateModal) => {
    ws.send(
      JSON.stringify({
        path: "/bot/create",
        input: { description, instructions, name },
      }),
    );
    setIsModalOpen(false);
  };
  const toggleModal = () => setIsModalOpen((v) => !v);
  const execute = (id: string) => () => {
    botDispatch({ type: "started", id });
    ws.send(
      JSON.stringify({
        path: "/bot/execute",
        input: { id },
      }),
    );
  };
  //todo, actually implement the backend of this
  const stopExecute = (id: string) => () => {
    botDispatch({ type: "finished", id });
  };
  return (
    <WsContext value={ws}>
      <Button onClick={toggleModal}>Add New</Button>
      <ModalCreateBot
        isOpen={isModalOpen}
        onCreate={onCreate}
        onCancel={toggleModal}
      />
      <BotList
        onConfirm={onConfirm}
        execute={execute}
        stopExecute={stopExecute}
        data={botState}
      />
    </WsContext>
  );
}

export default App;
