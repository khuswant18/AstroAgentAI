"""API routes for AstroAgent."""

import json
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException
# pyrefly: ignore [missing-import]
from sse_starlette.sse import EventSourceResponse
# pyrefly: ignore [missing-import]
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

from api.schemas import ChatRequest, HealthResponse, SessionInfo, HistoryMessage
from agent.state import AgentState
from agent.tools.geocode import geocode_place

logger = logging.getLogger("astroagent")
router = APIRouter()
graph = None

# In-memory session registry (session_id -> {first_message, created_at})
# In production, this would be backed by a database.
_session_registry: dict[str, dict] = {}


async def _stream_agent(request: ChatRequest) -> AsyncGenerator[dict, None]:
    """Stream agent events as SSE data dicts.
    
    Each yielded dict has a 'data' key with the JSON payload.
    EventSourceResponse handles serialisation and SSE framing.
    """
    session_id = request.session_id

    # Register session
    if session_id not in _session_registry:
        _session_registry[session_id] = {
            "first_message": request.message[:100],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    # Build birth details dict with geocoding if provided
    birth_details = None
    if request.birth_details:
        bd = request.birth_details
        birth_details = {
            "name": bd.name,
            "date": bd.date,
            "time": bd.time,
            "is_time_unknown": getattr(bd, "is_time_unknown", False),
            "place": bd.place,
            "lat": None,
            "lon": None,
            "timezone": None,
        }

        # Geocode the place to get lat/lon/timezone
        try:
            geo_result = geocode_place.invoke({"place": bd.place})
            birth_details["lat"] = geo_result["lat"]
            birth_details["lon"] = geo_result["lon"]
            birth_details["timezone"] = geo_result["timezone"]
        except Exception as e:
            logger.warning(f"Geocoding failed for '{bd.place}': {e}")
            yield {"data": json.dumps({"type": "error", "message": f"Could not locate place: {bd.place}. Please check the spelling."})}
            return

    # Build initial state
    initial_state: AgentState = {
        "messages": [HumanMessage(content=request.message)],
        "birth_details": birth_details,
        "natal_chart": None,
        "session_id": session_id,
        "tool_calls_this_turn": 0,
        "intent": None,
    }

    config = {
        "configurable": {"thread_id": session_id},
        "recursion_limit": 6,
    }

    try:
        # Stream events from the graph
        async for event in graph.astream_events(initial_state, config, version="v2"):
            kind = event.get("event", "")
            metadata = event.get("metadata", {})
            node = metadata.get("langgraph_node", "")

            # Stream LLM tokens from the agent and format_response nodes only
            if kind == "on_chat_model_stream" and node in ("agent", "format_response"):
                chunk = event.get("data", {}).get("chunk")
                if chunk and hasattr(chunk, "content") and chunk.content:
                    yield {"data": json.dumps({"type": "token", "content": chunk.content, "node": node})}

                # Also check for tool call chunks
                if chunk and hasattr(chunk, "tool_call_chunks") and chunk.tool_call_chunks:
                    pass  # Tool calls will be handled by tool start/end events

            # Tool invocation events
            elif kind == "on_tool_start":
                tool_name = event.get("name", "unknown")
                tool_input = event.get("data", {}).get("input", {})
                yield {"data": json.dumps({"type": "tool_start", "tool": tool_name, "input": tool_input})}

            elif kind == "on_tool_end":
                tool_name = event.get("name", "unknown")
                tool_output = event.get("data", {}).get("output", "")
                if not isinstance(tool_output, str):
                    if hasattr(tool_output, "content"):
                        tool_output = str(tool_output.content)
                    else:
                        tool_output = str(tool_output)
                # Truncate large outputs
                if len(tool_output) > 2000:
                    tool_output = tool_output[:2000] + "... (truncated)"
                yield {"data": json.dumps({"type": "tool_end", "tool": tool_name, "output": tool_output})}

        yield {"data": json.dumps({"type": "done", "session_id": session_id})}

    except Exception as e:
        logger.exception(f"Error streaming agent response: {e}")
        yield {"data": json.dumps({"type": "error", "message": str(e)})}


@router.post("/chat")
async def chat(request: ChatRequest):
    """SSE streaming chat endpoint."""
    return EventSourceResponse(
        _stream_agent(request),
        media_type="text/event-stream",
    )


@router.get("/history/{session_id}")
async def get_history(session_id: str):
    """Return the message history for a session."""
    config = {"configurable": {"thread_id": session_id}}

    try:
        # Try to get state from the graph's checkpointer
        state = await graph.aget_state(config)
        if state and state.values and "messages" in state.values:
            messages = state.values["messages"]
            history = []
            for msg in messages:
                if isinstance(msg, HumanMessage):
                    history.append(HistoryMessage(role="user", content=msg.content))
                elif isinstance(msg, AIMessage):
                    history.append(HistoryMessage(
                        role="assistant",
                        content=msg.content,
                        tool_calls=[tc for tc in (msg.tool_calls or [])] if msg.tool_calls else None,
                    ))
                elif isinstance(msg, ToolMessage):
                    history.append(HistoryMessage(role="tool", content=msg.content))
            return history
        return []
    except Exception:
        return []


@router.delete("/history/{session_id}")
async def clear_history(session_id: str):
    """Clear a session's history from both registry and checkpoint store."""
    _session_registry.pop(session_id, None)

    # Also clear checkpoint data from SQLite
    try:
        checkpointer = graph.checkpointer
        if hasattr(checkpointer, "conn") and checkpointer.conn:
            await checkpointer.conn.execute(
                "DELETE FROM checkpoints WHERE thread_id = ?", (session_id,)
            )
            await checkpointer.conn.execute(
                "DELETE FROM writes WHERE thread_id = ?", (session_id,)
            )
            await checkpointer.conn.commit()
    except Exception as e:
        logger.warning(f"Failed to clear checkpoint for session {session_id}: {e}")

    return {"status": "cleared", "session_id": session_id}


@router.get("/sessions")
async def list_sessions():
    """List all known sessions with metadata."""
    sessions = []
    for sid, meta in _session_registry.items():
        sessions.append(SessionInfo(
            session_id=sid,
            first_message=meta.get("first_message", ""),
            created_at=meta.get("created_at", ""),
        ))
    return sorted(sessions, key=lambda s: s.created_at, reverse=True)


@router.get("/health")
async def health():
    """Health check endpoint."""
    return HealthResponse(status="ok")
