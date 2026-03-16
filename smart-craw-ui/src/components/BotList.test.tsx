import { render } from "vitest-browser-react";
import { describe, it, expect, beforeEach } from "vitest";
import BotList from "./BotList.tsx";
import { useAppStore } from "../state/store.ts";
import { Action } from "../../../shared/models.ts";
import { connectWs } from "../services/ws.tsx";
import { ws } from "msw";
import { setupWorker } from "msw/browser";

describe("BotList with MSW WebSocket integration", () => {
  beforeEach(() => {
    useAppStore.setState({ bots: [], ws: null });
  });

  it("connects to WS, receives bots via MSW mock, and renders them", async () => {
    const mockWs = ws.link(/\/ws$/);
    const server = setupWorker(
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockWs.addEventListener("connection", ({ client, server }: any) => {
        server.connect();
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        client.addEventListener("message", (event: any) => {
          const data = JSON.parse(event.data as string);
          if (data.action === "/bot/all" || data.path === "/bot/all") {
            event.preventDefault();
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
          }
        });
      }),
    );
    await server.start({ quiet: true });

    // Initiate real frontend WS connection which MSW intercepts
    const wsInstance = connectWs();
    useAppStore.getState().setWs(wsInstance);

    const screen = await render(<BotList />);

    // Wait for the WS response to mutate Zustand and flow into React Component
    await expect.element(screen.getByText("MSW Mock Bot")).toBeInTheDocument();
    await expect
      .element(screen.getByText("Intercepted desc"))
      .toBeInTheDocument();
  });
});
