"""LangGraph graph definition for AstroAgent."""

from langgraph.graph import StateGraph, START, END
from agent.state import AgentState
from agent.nodes import (
    classify_intent,
    ensure_birth_details,
    agent,
    run_tools,
    safety_check,
    format_response,
)
from agent.router import should_skip_agent, route_after_agent


def build_graph():
    """Build and compile the AstroAgent graph.

    Graph flow:
        START → classify_intent → ensure_birth_details
            → (if details missing) → END (with clarifying question)
            → (if details present or not needed) → agent
                → (if tool_calls) → tools → agent (loop, max 8)
                → (if no tool_calls) → safety_check → format_response → END
    """
    builder = StateGraph(AgentState)

    # Add nodes
    builder.add_node("classify_intent", classify_intent)
    builder.add_node("ensure_birth_details", ensure_birth_details)
    builder.add_node("agent", agent)
    builder.add_node("tools", run_tools)
    builder.add_node("safety_check", safety_check)
    builder.add_node("format_response", format_response)

    # Entry edge
    builder.add_edge(START, "classify_intent")
    builder.add_edge("classify_intent", "ensure_birth_details")

    # Birth details gate
    builder.add_conditional_edges(
        "ensure_birth_details",
        should_skip_agent,
        {
            "ask_details": END,
            "continue": "agent",
        },
    )

    # Agent → tool loop or finish
    builder.add_conditional_edges(
        "agent",
        route_after_agent,
        {
            "call_tools": "tools",
            "finish": "safety_check",
        },
    )

    # Tools loop back to agent
    builder.add_edge("tools", "agent")

    # Safety → format → end
    builder.add_edge("safety_check", "format_response")
    builder.add_edge("format_response", END)

    return builder
