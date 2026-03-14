import { render } from "vitest-browser-react";
import { describe, it, expect, beforeEach } from "vitest";
import MainChat from "./MainChat.tsx";
import { useAppStore } from "../state/store.ts";

// Mocks centralized in setup.ts

describe("MainChat", () => {
  beforeEach(() => {
    useAppStore.setState({
      bots: [
        {
          id: "bot-1",
          name: "Bot 1",
          description: "Desc",
          instructions: "Inst",
          isExecuting: false,
        },
      ],
      llm: {
        id: "bot-1",
        approval: undefined,
        isExecuting: false,
        result: "",
        instructions: "",
      },
      messages: {
        "bot-1": [
          {
            id: "msg-1",
            message: "Hello from Bot 1!",
            reasoning: "Computing response...",
            timestamp: new Date(),
            partialMessage: false,
            partialReasoning: false,
          },
        ],
      },
    });
  });

  it("renders messages and reasoning panels accurately based on UI store state", async () => {
    const screen = await render(<MainChat />);

    await expect
      .element(screen.getByText("Hello from Bot 1!"))
      .toBeInTheDocument();

    // The thoughts collapse panel obscures exact DOM matches until opened
    await screen.getByText("Show thinking").click();

    await expect
      .element(screen.getByText("Computing response..."))
      .toBeInTheDocument();
  });
});
