import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import ToolActivity from "./ToolActivity";
import ThinkingIndicator from "./ThinkingIndicator";
import { useStore } from "../store/useStore";
import type { Message } from "../types";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message, isLast }: MessageBubbleProps & { isLast?: boolean }) {
  const { isStreaming } = useStore();
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  
  const isCurrentlyStreaming = isLast && isStreaming;

  if (isAssistant && isCurrentlyStreaming && !message.content && (!message.toolActivity || message.toolActivity.length === 0)) {
    return <ThinkingIndicator />;
  }

  return (
    <div
      className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-slide-up w-full`}
      id={`message-${message.id}`}
    >
      <div className={`flex items-start gap-2 max-w-[85%] ${isUser ? "md:max-w-[65%]" : "md:max-w-[75%]"}`}>
        {/* Assistant Star Indicator */}
        {isAssistant && (
          <div className="mt-1 flex-shrink-0 text-[#f0b95b] text-[8px]">
            ✦
          </div>
        )}

        <div className="flex flex-col w-full">
          {/* The Bubble */}
          <div
            className={`${
              isUser
                ? "bg-[linear-gradient(135deg,#2a1f0a,#1e1608)] border border-[rgba(240,185,91,0.25)] rounded-[18px_4px_18px_18px] text-[#f5e6c8] p-[12px_16px] leading-[1.6]"
                : "bg-[rgba(255,255,255,0.03)] border border-[rgba(240,185,91,0.1)] rounded-[4px_18px_18px_18px] text-[#e8e3d8] p-[14px_18px] leading-[1.7]"
            } font-body text-[15px] shadow-sm`}
          >
            {/* Tool activity (assistant only) */}
            {isAssistant &&
              message.toolActivity &&
              message.toolActivity.length > 0 && (
                <div className="mb-2">
                  <ToolActivity events={message.toolActivity} />
                </div>
              )}

            {/* Message content */}
            {message.content ? (
              isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className={`markdown-content ${isCurrentlyStreaming ? 'message-streaming' : ''}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )
            ) : (
              isAssistant && (
                <div className="flex items-center gap-1.5 py-1 h-6">
                  {/* Fallback for non-streaming empty assistant messages (should rarely happen) */}
                </div>
              )
            )}
          </div>

          {/* Timestamp (Outside Bubble) */}
          <div
            className={`text-[10px] text-[#6b6580] mt-1 ${
              isUser ? "text-right" : "text-left ml-1"
            }`}
          >
            {format(message.createdAt, "h:mm a")}
          </div>
        </div>
      </div>
    </div>
  );
}
