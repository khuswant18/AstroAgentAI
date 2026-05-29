import { create } from "zustand";
import type { Message, BirthDetails, ToolEvent } from "../types";

interface AppState {
  // ─── State ────────────────────────────────────────────────────────── 
  messages: Message[];
  sessionId: string;
  birthDetails: BirthDetails | null;
  isStreaming: boolean;

  // ─── Actions ────────────────────────────────────────────────────────
  addMessage: (msg: Message) => void;
  appendToken: (messageId: string, token: string) => void;
  attachToolEvent: (messageId: string, event: ToolEvent) => void;
  setBirthDetails: (details: BirthDetails) => void;
  clearBirthDetails: () => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
  newSession: () => void;
  setSessionId: (id: string) => void;
  loadHistory: () => Promise<void>;
}

function getOrCreateSessionId(): string {
  const stored = localStorage.getItem("astroagent_session_id");
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem("astroagent_session_id", id);
  return id;
}

function getStoredBirthDetails(): BirthDetails | null {
  const stored = localStorage.getItem("astroagent_birth_details");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export const useStore = create<AppState>((set, get) => ({
  messages: [],
  sessionId: getOrCreateSessionId(),
  birthDetails: getStoredBirthDetails(),
  isStreaming: false,

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  appendToken: (messageId, token) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, content: m.content + token } : m
      ),
    })),

  attachToolEvent: (messageId, event) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, toolActivity: [...(m.toolActivity || []), event] }
          : m
      ),
    })),

  setBirthDetails: (details) => {
    localStorage.setItem("astroagent_birth_details", JSON.stringify(details));
    set({ birthDetails: details });
  },

  clearBirthDetails: () => {
    localStorage.removeItem("astroagent_birth_details");
    set({ birthDetails: null });
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  clearMessages: () => set({ messages: [] }),

  newSession: () => {
    const id = crypto.randomUUID();
    localStorage.setItem("astroagent_session_id", id);
    set({ sessionId: id, messages: [] });
  },

  setSessionId: (id) => {
    localStorage.setItem("astroagent_session_id", id);
    set({ sessionId: id, messages: [] });
  },

  loadHistory: async () => {
    const { sessionId } = get();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/history/${sessionId}`);
      if (!res.ok) return;
      const history = await res.json();
      
      const newMessages = history.map((msg: any) => ({
        id: crypto.randomUUID(),
        role: msg.role === "tool" ? "assistant" : msg.role, // Tools render as assistant or hidden
        content: msg.content,
        toolActivity: [], // History endpoint currently doesn't rebuild toolActivity UI
        createdAt: new Date(),
      })).filter((m: any) => m.content); // filter out empty tool calls if any
      
      set({ messages: newMessages });
    } catch (e) {
      console.error("Failed to load history", e);
    }
  },
}));
