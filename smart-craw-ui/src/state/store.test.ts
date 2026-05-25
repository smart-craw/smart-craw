import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "./store.ts";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.setState({
      bots: [],
      messages: {},
      llm: {
        id: "",
        isExecuting: false,
        instructions: "",
      },
      notification: null,
      ws: null,
    });
  });

  it("adds a bot successfully with isExecuting false", () => {
    let store = useAppStore.getState();
    store.addBot({
      id: "bot-1",
      name: "Alpha",
      description: "Desc",
      instructions: "Inst",
      isExecuting: false,
    });

    store = useAppStore.getState();
    expect(store.bots).toHaveLength(1);
    expect(store.bots[0].id).toBe("bot-1");
    expect(store.bots[0].name).toBe("Alpha");
    expect(store.bots[0].isExecuting).toBe(false);
  });

  describe("get initial messages", () => {
    it("gets normal messages", () => {
      let store = useAppStore.getState();
      store.setMessages("123", [
        {
          id: "456",
          message: "hello world",
          reasoning: "I am reasoning",
          timestamp: "2025-05-05",
        },
      ]);
      store = useAppStore.getState();
      expect(store.messages["123"]).toEqual([
        {
          id: "456",
          message: "hello world",
          reasoning: "I am reasoning",
          timestamp: new Date("2025-05-05"),
          partialMessage: false,
          partialReasoning: false,
          isTool: false,
        },
      ]);
    });
    it("gets Gemma messages", () => {
      let store = useAppStore.getState();
      store.setMessages("123", [
        {
          id: "456",
          message: "hello world",
          reasoning: "thought I am reasoning",
          timestamp: "2025-05-05",
        },
      ]);
      store = useAppStore.getState();
      expect(store.messages["123"]).toEqual([
        {
          id: "456",
          message: "hello world",
          reasoning: "I am reasoning",
          timestamp: new Date("2025-05-05"),
          partialMessage: false,
          partialReasoning: false,
          isTool: false,
        },
      ]);
    });
  });
  describe("messages assembly", () => {
    it("processes reasoning block via <think> tags separately from main message", () => {
      let store = useAppStore.getState();

      // Start thinking block
      store.addMessage("bot-1", "pondering...", true);
      store = useAppStore.getState();
      expect(store.messages["bot-1"]).toHaveLength(1);
      expect(store.messages["bot-1"][0].partialReasoning).toBe(true);

      // Stream thinking text
      store.addMessage("bot-1", "cogitating...", true);
      store = useAppStore.getState();
      expect(store.messages["bot-1"][0].reasoning).toBe(
        "pondering...cogitating...",
      );

      // End thinking block
      store.addMessage("bot-1", "still considering...", false);
      store = useAppStore.getState();
      expect(store.messages["bot-1"][0].partialReasoning).toBe(false);
      expect(store.messages["bot-1"][0].reasoning).toBe(
        "pondering...cogitating...",
      );
      // Stream message block
      store.addMessage("bot-1", "hello world!", false);
      store = useAppStore.getState();
      expect(store.messages["bot-1"][0].message).toBe(
        "still considering...hello world!",
      );
    });
  });
});
