"""Conditional edge routing logic for the AstroAgent graph."""

# pyrefly: ignore [missing-import]
from langchain_core.messages import AIMessage
from agent.state import AgentState


def should_skip_agent(state: AgentState) -> str:
    """After ensure_birth_details: decide whether to proceed to agent or end.

    Returns:
        "ask_details" if we just asked for birth details (skip agent),
        "continue" to proceed to the agent node.
    """
    messages = state.get("messages", [])
    intent = state.get("intent", "other")
    birth_details = state.get("birth_details")

    # If we need birth details and don't have them, the ensure node already
    # added a message asking for them — go to END
    if intent in ("chart", "transit") and not birth_details:
        return "ask_details"

    return "continue"


def route_after_agent(state: AgentState) -> str:
    """After the agent node: decide whether to call tools or finish.

    Returns:
        "call_tools" if the agent wants to call tools,
        "finish" if the agent has a final answer.
    """
    messages = state.get("messages", [])
    if not messages:
        return "finish"

    last_msg = messages[-1]

    # Check if the agent wants to call tools
    if isinstance(last_msg, AIMessage) and last_msg.tool_calls:
        # Check loop guard
        tool_calls_this_turn = state.get("tool_calls_this_turn", 0)
        if tool_calls_this_turn >= 6:
            return "finish"
        return "call_tools"

    return "finish"
