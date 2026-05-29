import { useState, useRef, useEffect } from "react";
import { Send, Square, ChevronDown } from "lucide-react";
import { useStore } from "../store/useStore";
import { useChat } from "../hooks/useChat";
import MessageBubble from "./MessageBubble";

export default function Chat() {
  const { messages, isStreaming, birthDetails } = useStore();
  const { sendMessage, cancelStream } = useChat();
  const [input, setInput] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const firstName = birthDetails?.name?.split(" ")[0] || "there";

  // Auto-scroll to bottom when new messages arrive (if already near bottom)
  useEffect(() => {
    if (!showScrollButton) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showScrollButton]);

  // Handle scroll events to toggle scroll-to-bottom button
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollButton(distanceFromBottom > 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setTimeout(scrollToBottom, 50); // Ensure scroll after submit
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (msg.role === "tool") return false;
    const trimmed = (msg.content || "").trim();
    if (!trimmed && msg.role !== "assistant") return false;
    if (msg.role === "assistant" && (trimmed.startsWith("{") || trimmed.startsWith("["))) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages area */}
      <div 
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 relative"
      >
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in -mt-10">
            <div 
              className="text-[#f0b95b] text-[48px] mb-6 drop-shadow-[0_0_15px_rgba(240,185,91,0.5)]"
              style={{ animation: "pulseGentle 4s infinite" }}
            >
              ✦
            </div>
            <h2 className="font-serif text-[28px] text-[#e8e3d8] mb-2">
              Namaste, {firstName}
            </h2>
            <p className="text-[#6b6580] font-body italic text-[16px] mb-8">
              What would you like to explore today?
            </p>
            <div className="flex flex-wrap justify-center gap-3 max-w-lg">
              {[
                "What does my chart say?",
                "How's today's energy?",
                "Find a good time for...",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="rounded-[20px] border border-[rgba(240,185,91,0.2)] bg-[rgba(240,185,91,0.05)] px-4 py-2 text-[13px] text-[#e8e3d8] hover:bg-[rgba(240,185,91,0.1)] transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4 pb-4">
            {filteredMessages.map((msg, idx) => (
              <MessageBubble key={msg.id} message={msg} isLast={idx === filteredMessages.length - 1} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 md:right-8 w-9 h-9 rounded-full bg-[rgba(240,185,91,0.15)] border border-[rgba(240,185,91,0.3)] flex items-center justify-center text-[#f0b95b] hover:bg-[rgba(240,185,91,0.25)] transition-colors z-10"
            title="Scroll to bottom"
          >
            <ChevronDown size={16} />
          </button>
        )}
      </div>

      {/* Input bar */}
      <div className="px-4 md:px-8 pb-4 pt-2">
        <form
          onSubmit={handleSubmit}
          className="max-w-[720px] mx-auto flex items-end bg-[rgba(255,255,255,0.03)] border border-[rgba(240,185,91,0.15)] rounded-[16px] p-[6px_6px_6px_16px] backdrop-blur-[10px] shadow-lg relative z-20"
          id="chat-input-form"
        >
          <div className="flex-1 relative flex items-center">
            <textarea
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your stars..."
              disabled={isStreaming}
              rows={1}
              className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-[#e8e3d8] font-body text-[15px] placeholder:text-[#4a4560] resize-none py-2 disabled:opacity-50"
              style={{ boxShadow: 'none' }}
            />
          </div>

          {isStreaming ? (
            <button
              type="button"
              onClick={cancelStream}
              id="cancel-stream-btn"
              className="flex-shrink-0 w-10 h-10 ml-2 rounded-[12px] bg-ara-error/20 flex items-center justify-center text-ara-error hover:bg-ara-error/30 transition-all border border-ara-error/30"
              title="Stop generating"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              type="submit"
              id="send-message-btn"
              disabled={!input.trim()}
              className="flex-shrink-0 w-10 h-10 ml-2 rounded-[12px] bg-[linear-gradient(135deg,#c49030,#f0b95b)] flex items-center justify-center text-[#0b0a14] hover:brightness-110 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
              title="Send message"
            >
              <Send size={16} />
            </button>
          )}
        </form>

        <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.04)]">
          <p className="text-center text-[11px] text-[#3d3a52] hover:text-[#6b6580] transition-colors max-w-3xl mx-auto cursor-default">
            Aradhana offers astrological reflection, not professional advice.
          </p>
        </div>
      </div>
    </div>
  );
}
