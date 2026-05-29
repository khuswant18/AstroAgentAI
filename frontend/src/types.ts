export type Role = "user" | "assistant" | "tool";

export interface ToolEvent {
  type: "tool_start" | "tool_end";
  tool: string;
  data: Record<string, unknown>;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  toolActivity?: ToolEvent[];
  createdAt: Date;
}

export interface BirthDetails {
  name: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  isTimeUnknown?: boolean;
  place: string;
}

export interface SSEEvent {
  type: "token" | "tool_start" | "tool_end" | "done" | "error";
  content?: string;
  tool?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  message?: string;
  session_id?: string;
  node?: string;
}

export interface SessionInfo {
  session_id: string;
  first_message: string;
  created_at: string;
}
