import { create } from "zustand";
import type { Approval, MessageOutput } from "../../../shared/models.ts";

export type Bot = {
  name: string;
  id: string;
  description: string;
  instructions: string;
  approval?: Approval;
  isExecuting: boolean;
};

export type Message = {
  id: string; //message id
  message: string;
  reasoning: string;
  timestamp: Date;
  partialReasoning: boolean; //true if reasoning isn't finished
  partialMessage: boolean;
};

export type Llm = {
  id: string;
  instructions: string;
  approval?: Approval;
  isExecuting: boolean;
  result: string;
};

export type Notification = {
  message: string;
  notificationType: string;
};

export function dateUtcConvertor(dateInUTC: string) {
  return new Date(`${dateInUTC.replace(" ", "T")}Z`);
}

export type AppState = {
  // State
  bots: Bot[];
  messages: Record<string, Message[]>;
  notification: Notification | null;
  llm: Llm;
  ws: WebSocket | null;

  // Actions
  setWs: (ws: WebSocket | null) => void;

  setBots: (bots: Bot[]) => void;
  addBot: (bot: Bot) => void;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  setBotApproval: (id: string, toolName: string, input: any) => void;
  actionBotApproval: (id: string, approved: boolean) => void;
  deleteBot: (id: string) => void;
  startBot: (id: string) => void;
  finishBot: (id: string) => void;

  setMessages: (id: string, messages: MessageOutput[]) => void;
  addMessage: (botId: string, message: string) => void;
  finishMessage: (botId: string) => void;

  setLlm: (llm: Llm) => void;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  setLlmApproval: (id: string, toolName: string, input: any) => void;
  actionLlmApproval: (approved: boolean) => void;
  startLlm: () => void;
  finishLlm: (result: string) => void;

  setNotification: (notification: Notification) => void;
};

export const useAppStore = create<AppState>((set) => ({
  bots: [],
  messages: {},
  notification: null,
  llm: {
    id: "hello",
    instructions: "",
    result: "",
    approval: undefined,
    isExecuting: false,
  },
  ws: null,

  setWs: (ws) => set({ ws }),

  setBots: (bots) => set({ bots }),
  addBot: (bot) =>
    set((state) => ({ bots: [...state.bots, { ...bot, isExecuting: false }] })),
  setBotApproval: (id, toolName, input) =>
    set((state) => ({
      bots: state.bots.map((v) =>
        v.id === id ? { ...v, approval: { toolName, input } } : v,
      ),
    })),
  actionBotApproval: (id, approved) =>
    set((state) => ({
      bots: state.bots.map((v) =>
        v.id === id ? { ...v, approval: undefined, isExecuting: approved } : v,
      ),
    })),
  deleteBot: (id) =>
    set((state) => ({
      bots: state.bots.filter((t) => t.id !== id),
    })),
  startBot: (id) =>
    set((state) => ({
      bots: state.bots.map((v) =>
        v.id === id ? { ...v, isExecuting: true } : v,
      ),
    })),
  finishBot: (id) =>
    set((state) => ({
      bots: state.bots.map((v) =>
        v.id === id ? { ...v, isExecuting: false } : v,
      ),
    })),

  setMessages: (id, messagesById) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [id]: messagesById.map(({ id, message, reasoning, timestamp }) => ({
          id,
          message,
          reasoning,
          timestamp: dateUtcConvertor(timestamp as string),
          partialReasoning: false,
          partialMessage: false,
        })),
      },
    })),

  addMessage: (botId, message) =>
    set((state) => {
      const messages = state.messages;
      const messagesForBot = messages[botId] || [];

      if (message === "<think>") {
        const id = window.crypto.randomUUID();
        return {
          messages: {
            ...messages,
            [botId]: [
              ...messagesForBot,
              {
                id,
                message: "",
                reasoning: "",
                partialReasoning: true,
                partialMessage: true,
                timestamp: new Date(),
              },
            ],
          },
        };
      } else if (message === "</think>") {
        const lastMessage = messagesForBot[messagesForBot.length - 1];
        const allButLast = messagesForBot.slice(0, -1);
        return {
          messages: {
            ...messages,
            [botId]: [
              ...allButLast,
              { ...lastMessage, partialReasoning: false, partialMessage: true },
            ],
          },
        };
      } else {
        const lastMessage = messagesForBot[messagesForBot.length - 1];
        if (!lastMessage) return state; // Safety guard
        const allButLast = messagesForBot.slice(0, -1);

        if (lastMessage.partialReasoning) {
          return {
            messages: {
              ...messages,
              [botId]: [
                ...allButLast,
                {
                  ...lastMessage,
                  reasoning: lastMessage.reasoning + message,
                  partialReasoning: true,
                  partialMessage: true,
                },
              ],
            },
          };
        } else {
          return {
            messages: {
              ...messages,
              [botId]: [
                ...allButLast,
                {
                  ...lastMessage,
                  message: lastMessage.message + message,
                  partialMessage: true,
                },
              ],
            },
          };
        }
      }
    }),
  finishMessage: (botId) =>
    set((state) => {
      const messages = state.messages;
      const messagesForBot = messages[botId] || [];
      const lastMessage = messagesForBot[messagesForBot.length - 1];
      const allButLast = messagesForBot.slice(0, -1);

      if (!lastMessage) return state;

      return {
        messages: {
          ...messages,
          [botId]: [...allButLast, { ...lastMessage, partialMessage: false }],
        },
      };
    }),

  setLlm: (llm) => set({ llm }),
  setLlmApproval: (id, toolName, input) =>
    set((state) => ({
      llm: { ...state.llm, id, approval: { toolName, input } },
    })),
  actionLlmApproval: (approved) =>
    set((state) => ({
      llm: { ...state.llm, approval: undefined, isExecuting: approved },
    })),
  startLlm: () =>
    set((state) => ({
      llm: { ...state.llm, isExecuting: true },
    })),
  finishLlm: (result) =>
    set((state) => ({
      llm: { ...state.llm, result, isExecuting: false },
    })),

  setNotification: (notification) => set({ notification }),
}));
