import { useReducer, createContext } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { connectWs } from "./services/ws";
import { botReducer } from "./state/bot";
import { notificationReducer } from "./state/notification";
import { approvalReducer } from "./state/approval";
import { messageReducer } from "./state/message";
const WsContext = createContext<WebSocket | null>(null);
function App() {
  //const [count, setCount] = useState(0);
  const [botState, botDispatch] = useReducer(botReducer, []);
  const [messageState, messageDispatch] = useReducer(messageReducer, {});
  const [notificationState, notificationDispatch] = useReducer(
    notificationReducer,
    [],
  );
  const [approvalState, approvalDispatch] = useReducer(approvalReducer, []);
  //put dispatches here
  const ws = connectWs(
    botDispatch,
    messageDispatch,
    notificationDispatch,
    approvalDispatch,
  );
  return (
    <WsContext value={ws}>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </WsContext>
  );
}

export default App;
