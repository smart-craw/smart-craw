import { createContext } from "react";

export const WsContext = createContext<WebSocket | null>(null);
