import { render } from "vitest-browser-react";
import { describe, it, expect, beforeEach } from "vitest";
import BotList from "./BotList.tsx";
import { useAppStore } from "../state/store.ts";
import { mockWs, worker } from "../tests/setup.ts";
import { Action } from "../../../shared/models.ts";
import { connectWs } from "../services/ws.tsx";

describe("BotList with MSW WebSocket integration", () => {
  beforeEach(() => {
    useAppStore.setState({ bots: [], ws: null });
  });

  it("connects to WS, receives bots via MSW mock, and renders them", async () => {
    // Stage the backend websocket mock behavior
    worker.use(
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockWs.addEventListener("connection", ({ client }: any) => {
        client.send(
          JSON.stringify({
            action: Action.GetBots,
            bots: [
              {
                id: "bot-999",
                name: "MSW Mock Bot",
                description: "Intercepted desc",
                instructions: "inst",
              },
            ],
          }),
        );
      }),
    );

    // Initiate real frontend WS connection which MSW intercepts
    const wsInstance = connectWs();
    useAppStore.getState().setWs(wsInstance);

    const screen = await render(<BotList onCreateBot={() => {}} />);

    // Wait for the WS response to mutate Zustand and flow into React Component
    await expect.element(screen.getByText("MSW Mock Bot")).toBeInTheDocument();
    await expect
      .element(screen.getByText("Intercepted desc"))
      .toBeInTheDocument();
  });
});
