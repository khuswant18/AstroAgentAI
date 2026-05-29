import { useState } from "react";
import { ChevronDown, ChevronRight, Wrench } from "lucide-react";
import type { ToolEvent } from "../types";

interface ToolActivityProps {
  events: ToolEvent[];
}

const TOOL_LABELS: Record<string, string> = {
  geocode_place: "📍 Geocoding location",
  compute_birth_chart: "🌟 Computing birth chart",
  get_daily_transits: "🔮 Calculating transits",
  knowledge_lookup: "📚 Searching knowledge",
};

export default function ToolActivity({ events }: ToolActivityProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!events || events.length === 0) return null;

  // Group events into pairs (start + end)
  const toolCalls: {
    tool: string;
    input?: Record<string, unknown>;
    output?: unknown;
    status: "running" | "completed";
  }[] = [];

  for (const evt of events) {
    if (evt.type === "tool_start") {
      toolCalls.push({
        tool: evt.tool,
        input: evt.data,
        status: "running",
      });
    } else if (evt.type === "tool_end") {
      // Find the matching start
      const match = [...toolCalls]
        .reverse()
        .find((tc) => tc.tool === evt.tool && tc.status === "running");
      if (match) {
        match.output = evt.data?.output;
        match.status = "completed";
      }
    }
  }

  const runningTool = toolCalls.find((tc) => tc.status === "running");

  return (
    <div className="mb-3 animate-fade-in">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-ara-text-muted hover:text-ara-text-dim transition-colors group"
        id="toggle-tool-activity"
      >
        {runningTool ? (
          <>
            <div className="w-3 h-3 border-2 border-ara-accent/40 border-t-ara-accent rounded-full animate-spin"></div>
            <span className="text-ara-accent animate-pulse-gentle">
              {TOOL_LABELS[runningTool.tool]?.replace(/[^\x00-\x7F]/g, "").trim() + "..." || `Running ${runningTool.tool}...`}
            </span>
          </>
        ) : (
          <>
            <Wrench size={12} className="text-ara-accent/60" />
            <span>
              {toolCalls.length} tool{toolCalls.length !== 1 ? "s" : ""} used
            </span>
          </>
        )}
        {isExpanded ? (
          <ChevronDown size={12} />
        ) : (
          <ChevronRight size={12} />
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 ml-1 space-y-2 animate-slide-up">
          {toolCalls.map((tc, i) => (
            <div key={i} className="tool-connector pl-6 relative">
              {/* Dot */}
              <div
                className={`absolute left-0 top-1 w-[22px] h-[22px] rounded-full border flex items-center justify-center text-[10px] ${
                  tc.status === "completed"
                    ? "border-ara-accent/40 bg-ara-accent/10 text-ara-accent"
                    : "border-ara-text-muted/30 bg-ara-surface animate-pulse-gentle text-ara-text-muted"
                }`}
              >
                {tc.status === "completed" ? "✓" : "⟳"}
              </div>

              <div className="text-xs">
                <div className="text-ara-text-dim font-medium">
                  {TOOL_LABELS[tc.tool] || `🔧 ${tc.tool}`}
                </div>

                {tc.input && Object.keys(tc.input).length > 0 && (
                  <details className="mt-1">
                    <summary className="text-ara-text-muted cursor-pointer hover:text-ara-text-dim transition-colors">
                      Input
                    </summary>
                    <pre className="mt-1 p-2 rounded bg-ara-surface text-[10px] text-ara-text-muted overflow-x-auto max-h-32">
                      {JSON.stringify(tc.input, null, 2)}
                    </pre>
                  </details>
                )}

                {tc.output != null && (
                  <details className="mt-1">
                    <summary className="text-ara-text-muted cursor-pointer hover:text-ara-text-dim transition-colors">
                      Output
                    </summary>
                    <pre className="mt-1 p-2 rounded bg-ara-surface text-[10px] text-ara-text-muted overflow-x-auto max-h-32">
                      {typeof tc.output === "string"
                        ? tc.output.slice(0, 1000)
                        : String(JSON.stringify(tc.output, null, 2) ?? "").slice(0, 1000)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
