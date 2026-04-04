import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  routeCreateBot,
  routeRemoveBot,
  routeGetAllBots,
  routeGetMessages,
  routeApproval,
} from "./router.ts";
import { Action, Assistant } from "../../shared/models.ts";

// Mock the llm utils dependency
vi.mock("../llm_utils/bots.ts", () => ({
  createBot: vi.fn().mockReturnValue({
    id: "mock-id",
    name: "test-bot",
    definition: {
      "test-bot": {
        description: "desc",
        prompt: "prompt",
      },
    },
  }),
  botExecute: vi.fn(),
}));

describe("Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("routeCreateBot", () => {
    it("should call insertBot and ws.send", () => {
      const sendToClientMock = vi.fn();
      const manageBotFolder = vi.fn();
      const insertBotMock = vi.fn();
      const insertBotCronMock = vi.fn();
      const insertMessageMock = vi.fn();
      const holdQueries = new Map();
      const pendingApprovals = new Map();
      const scheduledBots = new Map();
      routeCreateBot(
        { name: "test-bot", description: "desc", instructions: "instr" } as any,
        "mydirectory",
        sendToClientMock,
        manageBotFolder,
        insertBotMock,
        insertBotCronMock,
        insertMessageMock,
        holdQueries,
        pendingApprovals,
        scheduledBots,
      );

      expect(insertBotMock).toHaveBeenCalledWith(
        "mock-id",
        "test-bot",
        "desc",
        "prompt",
      );
      expect(sendToClientMock).toHaveBeenCalled();
      expect(manageBotFolder).toHaveBeenCalled();

      const sentData = JSON.parse(sendToClientMock.mock.calls[0][0]);
      expect(sentData.action).toBe(Action.CreateBot);
      expect(sentData.name).toBe("test-bot");
    });
  });

  describe("routeRemoveBot", () => {
    it("should call removeBot", () => {
      const removeBotMock = vi.fn();
      const scheduledBots = new Map();
      routeRemoveBot({ id: "bot-1" } as any, removeBotMock, scheduledBots);

      expect(removeBotMock).toHaveBeenCalledWith("bot-1");
    });
  });

  describe("routeGetAllBots", () => {
    it("should call getBots and send result via websocket", () => {
      const sendToClient = vi.fn();
      const getBotsMock = vi.fn().mockReturnValue([{ id: "bot-1" }]);
      routeGetAllBots(sendToClient, getBotsMock);

      expect(getBotsMock).toHaveBeenCalled();
      expect(sendToClient).toHaveBeenCalled();

      const sentData = JSON.parse(sendToClient.mock.calls[0][0]);
      expect(sentData.action).toBe(Action.GetBots);
      expect(sentData.bots).toEqual([{ id: "bot-1" }]);
    });
  });

  describe("routeGetMessages", () => {
    it("should call getMessages and send result", () => {
      const sendToClient = vi.fn();
      const getMessagesMock = vi.fn().mockReturnValue([{ id: "msg-1" }]);
      routeGetMessages({ id: "bot-1" } as any, sendToClient, getMessagesMock);

      expect(getMessagesMock).toHaveBeenCalledWith("bot-1");
      expect(sendToClient).toHaveBeenCalled();

      const sentData = JSON.parse(sendToClient.mock.calls[0][0]);
      expect(sentData.action).toBe(Action.GetMessages);
      expect(sentData.id).toBe("bot-1");
      expect(sentData.messages).toEqual([{ id: "msg-1" }]);
    });
  });

  describe("routeApproval", () => {
    it("should invoke pending approval function and send actioned message", () => {
      const sendToClient = vi.fn();
      const resolveMock = vi.fn();
      const pendingApprovals = new Map<string, (approved: boolean) => void>();
      pendingApprovals.set("app-1", resolveMock);

      routeApproval(
        { id: "app-1", approved: true } as any,
        sendToClient,
        Assistant.Bot,
        pendingApprovals,
      );

      expect(resolveMock).toHaveBeenCalledWith(true);
      expect(pendingApprovals.has("app-1")).toBe(false);
      expect(sendToClient).toHaveBeenCalled();

      const sentData = JSON.parse(sendToClient.mock.calls[0][0]);
      expect(sentData.action).toBe(Action.ApprovalActioned);
      expect(sentData.approved).toBe(true);
    });
  });
});
