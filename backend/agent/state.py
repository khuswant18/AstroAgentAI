"""Agent state definition for the AstroAgent LangGraph graph."""

from typing import Annotated, TypedDict, Optional
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class BirthDetails(TypedDict):
    """Birth details for natal chart computation."""
    name: str
    date: str        # ISO format: YYYY-MM-DD
    time: str        # HH:MM (24h)
    place: str       # free text e.g. "Mumbai, India"
    lat: Optional[float]
    lon: Optional[float]
    timezone: Optional[str]  # e.g. "Asia/Kolkata"


class AgentState(TypedDict):
    """Full state for the AstroAgent LangGraph graph."""
    messages: Annotated[list[BaseMessage], add_messages]
    birth_details: Optional[BirthDetails]
    natal_chart: Optional[dict]        # cached chart output
    session_id: str
    tool_calls_this_turn: int          # guard against infinite loops
    intent: Optional[str]              # "chart" | "transit" | "question" | "other"
