import { useCallback, useRef } from "react";
import { useStore } from "../store/useStore";
import type { SSEEvent, Message } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const MAX_RETRIES = 2;

export function useChat() {
  const {
    sessionId,
    birthDetails,
    isStreaming,
    addMessage,
    appendToken,
    attachToolEvent,
    setStreaming,
  } = useStore();

  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming || !text.trim()) return;

      // Add user message
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        createdAt: new Date(),
      };
      addMessage(userMsg);

      // Create assistant message placeholder
      const assistantMsgId = crypto.randomUUID();
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        toolActivity: [],
        createdAt: new Date(),
      };
      addMessage(assistantMsg);
      setStreaming(true);

      let attempt = 0;
      let success = false;

      while (attempt <= MAX_RETRIES && !success) {
        attempt++;
        abortRef.current = new AbortController();
        
        // 30s timeout
        const timeoutId = setTimeout(() => {
          abortRef.current?.abort(new Error("Timeout"));
        }, 30000);

        try {
          const response = await fetch(`${API_BASE}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId,
              message: text.trim(),
              birth_details: birthDetails,
            }),
            signal: abortRef.current.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error("No response body");

          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE events (split on double newline)
            const parts = buffer.split("\n\n");
            // Keep the last (possibly incomplete) part in the buffer
            buffer = parts.pop() || "";

            for (const part of parts) {
              const lines = part.split("\n");
              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;

                const jsonStr = line.slice(6).trim();
                if (!jsonStr || jsonStr === "[DONE]") continue;

                try {
                  const event: SSEEvent = JSON.parse(jsonStr);
                  handleSSEEvent(event, assistantMsgId);
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }

          // Process any remaining buffer
          if (buffer.trim()) {
            const lines = buffer.split("\n");
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === "[DONE]") continue;
              try {
                const event: SSEEvent = JSON.parse(jsonStr);
                handleSSEEvent(event, assistantMsgId);
              } catch {
                // Skip
              }
            }
          }

          success = true;
        } catch (err: unknown) {
          if (err instanceof DOMException && err.name === "AbortError") {
            break; // User cancelled
          }
          if (attempt > MAX_RETRIES) {
            const isTimeout = err instanceof Error && err.message === "Timeout";
            const errorMessage = isTimeout 
              ? "The connection timed out" 
              : "The stars are a bit cloudy right now";
              
            appendToken(
              assistantMsgId,
              `\n\n*${errorMessage}. Please try again in a moment.*`
            );
          }
          // Otherwise retry
        }
      }

      setStreaming(false);
      abortRef.current = null;
    },
    [
      sessionId,
      birthDetails,
      isStreaming,
      addMessage,
      appendToken,
      attachToolEvent,
      setStreaming,
    ]
  );

  const handleSSEEvent = useCallback(
    (event: SSEEvent, assistantMsgId: string) => {
      switch (event.type) {
        case "token": {
          const RENDERABLE_NODES = ["agent", "format_response", "safety_check"];
          if (event.node && !RENDERABLE_NODES.includes(event.node)) break;
          if (event.content) {
            // Block raw JSON objects/arrays from appearing in chat
            const trimmed = event.content.trim();
            if (
              (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
              (trimmed.startsWith("[") && trimmed.endsWith("]"))
            ) {
              break;
            }
            appendToken(assistantMsgId, event.content);
          }
          break;
        }

        case "tool_start":
          attachToolEvent(assistantMsgId, {
            type: "tool_start",
            tool: event.tool || "unknown",
            data: (event.input as Record<string, unknown>) || {},
          });
          break;

        case "tool_end":
          attachToolEvent(assistantMsgId, {
            type: "tool_end",
            tool: event.tool || "unknown",
            data: { output: event.output },
          });
          break;

        case "error":
          appendToken(
            assistantMsgId,
            `\n\n*${event.message || "An error occurred"}*`
          );
          break;

        case "done":
          // Stream complete — handled by the while loop exiting
          break;
      }
    },
    [appendToken, attachToolEvent]
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, [setStreaming]);

  return { sendMessage, cancelStream, isStreaming };
}
