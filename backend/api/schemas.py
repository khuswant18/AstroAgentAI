"""Pydantic v2 models for request/response schemas."""

from typing import Optional
from pydantic import BaseModel, Field


class BirthDetailsModel(BaseModel):
    """Birth details submitted from the frontend."""
    name: str = Field(..., min_length=1, description="Full name")
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Date of birth (YYYY-MM-DD)")
    time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="Time of birth (HH:MM, 24h)")
    is_time_unknown: bool = Field(False, description="Whether the time of birth is unknown")
    place: str = Field(..., min_length=1, description="Place of birth")


class ChatRequest(BaseModel):
    """Request body for the /chat endpoint."""
    session_id: str = Field(..., min_length=1, description="Unique session identifier")
    message: str = Field(..., min_length=1, description="User message text")
    birth_details: Optional[BirthDetailsModel] = Field(None, description="Birth details, sent with every request")


class SessionInfo(BaseModel):
    """Summary info for a session."""
    session_id: str
    first_message: str = ""
    created_at: str = ""


class HistoryMessage(BaseModel):
    """A single message in the history."""
    role: str
    content: str
    tool_calls: Optional[list] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
