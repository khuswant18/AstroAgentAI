import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore } from "../store/useStore";
import type { SessionInfo } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function Sidebar() {
  const { sessionId, newSession, setSessionId, clearMessages } = useStore();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch {
      // Backend may not be running yet
    }
    setLoading(false);
  };

  const handleNewConversation = () => {
    newSession();
    fetchSessions();
  };

  const handleClearHistory = async () => {
    try {
      await fetch(`${API_BASE}/history/${sessionId}`, { method: "DELETE" });
      clearMessages();
      fetchSessions();
    } catch {
      clearMessages();
    }
  };

  return (
    <div className="w-64 h-full flex flex-col transition-all bg-[#0d0c1d] border-r border-ara-accent/10">
      {/* Logo Area */}
      <div className="p-6">
        <h1 
          className="font-serif text-[22px] text-ara-accent"
          style={{ textShadow: "0 0 20px rgba(240,185,91,0.3)" }}
        >
          ✦ Aradhana
        </h1>
      </div>

      {/* New Conversation Button */}
      <div className="px-4 pb-4">
        <button
          onClick={handleNewConversation}
          disabled={loading}
          className="w-full h-10 rounded-lg flex items-center justify-center gap-2 border border-ara-accent/30 bg-ara-accent/5 text-ara-accent text-[13px] tracking-wide hover:bg-ara-accent/10 transition-colors duration-200 disabled:opacity-50"
        >
          <Plus size={16} />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {loading && (
          <p className="text-ara-text-muted text-xs text-center py-4">
            Loading...
          </p>
        )}

        {!loading && sessions.length === 0 && (
          <p className="text-ara-text-muted text-xs text-center py-4">
            No conversations yet
          </p>
        )}

        {sessions.map((s) => (
          <div
            key={s.session_id}
            onClick={() => setSessionId(s.session_id)}
            className={`p-[10px_12px] rounded-lg cursor-pointer transition-colors ${
              s.session_id === sessionId
                ? "bg-ara-accent/10 border-l-2 border-l-ara-accent"
                : "hover:bg-ara-accent/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-ara-accent flex-shrink-0">✦</span>
              <div className="text-[13px] text-[#e8e3d8] truncate">
                {s.first_message || "New Conversation"}
              </div>
            </div>
            <div className="text-[11px] text-[#6b6580] font-mono mt-1 ml-4">
              {new Date(s.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {/* Clear History */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleClearHistory}
          disabled={loading || !sessionId}
          className="w-full flex items-center gap-2 p-[16px_12px] rounded-lg text-[12px] text-[#6b6580] hover:text-[#e8e3d8] transition-colors group disabled:opacity-50"
        >
          <Trash2 size={14} className="group-hover:text-ara-accent transition-colors" />
          <span>Clear History</span>
        </button>
      </div>
    </div>
  );
}
