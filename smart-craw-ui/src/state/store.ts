import { create } from "zustand";
import type { Approval, MessageOutput } from "../../../shared/models.ts";

export type Bot = {
  name: string;
  id: string;
  description: string;
  instructions: string;
  approval?: Approval;
  isExecuting: boolean;
  isSuccess?: boolean;
  cron?: string;
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
  isSuccess?: boolean;
};

export type Notification = {
  message: string;
  notificationType: string;
};

export function dateUtcConvertor(dateInUTC: string) {
  return new Date(`${dateInUTC.replace(" ", "T")}Z`);
}

export type Settings = {
  coneOfSilence: boolean;
};
export type AppState = {
  // State
  bots: Bot[];
  messages: Record<string, Message[]>;
  notification: Notification | null;
  llm: Llm;
  ws: WebSocket | null;
  settings: Settings;

  // Actions
  //
  setWs: (ws: WebSocket | null) => void;
  setBot: (bot: Bot) => void;
  setBots: (bots: Bot[]) => void;
  addBot: (bot: Bot) => void;
  setSettings: (settings: Settings) => void;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  setBotApproval: (id: string, toolName: string, input: any) => void;
  actionBotApproval: (id: string, approved: boolean) => void;
  deleteBot: (id: string) => void;
  startBot: (id: string) => void;
  finishBot: (id: string, isSuccess: boolean) => void;

  setMessages: (id: string, messages: MessageOutput[]) => void;
  addMessage: (botId: string, message: string, isThinking: boolean) => void;
  finishMessage: (botId: string) => void;

  setLlm: (llm: Llm) => void;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  setLlmApproval: (id: string, toolName: string, input: any) => void;
  actionLlmApproval: (approved: boolean) => void;
  startLlm: () => void;
  finishLlm: (isSuccess: boolean) => void;

  setNotification: (notification: Notification) => void;
};

const setMessage = (message: string, isThinking: boolean) =>
  isThinking ? "" : message;
const setReasoning = (message: string, isThinking: boolean) =>
  isThinking ? message : "";
const stripThinking = (message: string) => {
  //Gemma puts an extra "thought" into its reasoning, replace it client side
  if (message.startsWith("thought")) {
    return message.replace("thought", "").trim();
  } else {
    return message;
  }
};
export const useAppStore = create<AppState>((set) => ({
  bots: [],
  messages: {},
  notification: null,
  llm: {
    id: "hello",
    instructions: "",
    approval: undefined,
    isExecuting: false,
  },
  ws: null,
  settings: {
    coneOfSilence: false,
  },
  setSettings: (settings: Settings) => set({ settings }),
  setWs: (ws) => set({ ws }),
  setBot: ({ id, description, name, instructions, cron }) =>
    set((state) => ({
      bots: state.bots.map((v) =>
        v.id === id ? { ...v, description, name, instructions, cron } : v,
      ),
    })),
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
        v.id === id ? { ...v, isExecuting: true, isSuccess: undefined } : v,
      ),
    })),
  finishBot: (id, isSuccess) =>
    set((state) => ({
      bots: state.bots.map((v) =>
        v.id === id ? { ...v, isExecuting: false, isSuccess } : v,
      ),
    })),

  setMessages: (id, messagesById) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [id]: messagesById.map(({ id, message, reasoning, timestamp }) => ({
          id,
          message,
          reasoning: stripThinking(reasoning),
          timestamp: dateUtcConvertor(timestamp as string),
          partialReasoning: false,
          partialMessage: false,
        })),
      },
    })),

  addMessage: (botId, message, isThinking) =>
    set((state) => {
      const messages = state.messages;
      const messagesForBot = messages[botId] || [];
      const isFirstMessage =
        messagesForBot.length === 0 || //no messages at all
        messagesForBot[messagesForBot.length - 1].partialMessage === false; //last message has completed (ie, this one is a new message)
      if (isFirstMessage) {
        const id = window.crypto.randomUUID();
        return {
          messages: {
            ...messages,
            [botId]: [
              ...messagesForBot,
              {
                id,
                message: setMessage(message, isThinking),
                reasoning: stripThinking(setReasoning(message, isThinking)),
                partialReasoning: isThinking,
                partialMessage: true,
                timestamp: new Date(),
              },
            ],
          },
        };
      } else {
        const lastMessage = messagesForBot[messagesForBot.length - 1];
        const allButLast = messagesForBot.slice(0, -1);
        return {
          messages: {
            ...messages,
            [botId]: [
              ...allButLast,
              {
                ...lastMessage,
                message: lastMessage.message + setMessage(message, isThinking),
                reasoning: stripThinking(
                  lastMessage.reasoning + setReasoning(message, isThinking),
                ),
                partialReasoning: isThinking,
                partialMessage: true,
              },
            ],
          },
        };
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
      llm: { ...state.llm, isSuccess: undefined, isExecuting: true },
    })),
  finishLlm: (isSuccess: boolean) =>
    set((state) => ({
      llm: { ...state.llm, isSuccess, isExecuting: false },
    })),

  setNotification: (notification) => set({ notification }),
}));
