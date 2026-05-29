"""FastAPI application entry point for AstroAgent."""

import os
import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Verify required env vars
REQUIRED_ENV_VARS = [
    "GROQ_API_KEY",
    "GROQ_MODEL",
    "FRONTEND_ORIGIN",
    "DATABASE_URL",
]
for var in REQUIRED_ENV_VARS:
    if not os.getenv(var):
        raise ValueError(f"Missing required environment variable: {var}")

# Configure logging
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level, logging.INFO),
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("astroagent")


import aiosqlite
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from agent.graph import build_graph
import api.routes as routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — connect to ChromaDB and initialize checkpointer."""
    logger.info("AstroAgent starting up...")

    # Verify ChromaDB is accessible (don't ingest — that's ingest.py's job)
    chroma_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
    if os.path.exists(chroma_dir):
        logger.info(f"ChromaDB persist directory found: {chroma_dir}")
    else:
        logger.warning(
            f"ChromaDB persist directory not found: {chroma_dir}. "
            "Run 'python ingest.py' to initialize the knowledge base."
        )

    # Initialize checkpointer and compile graph
    db_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./astroagent.db")
    db_path = db_url.replace("sqlite+aiosqlite:///", "")
    conn = await aiosqlite.connect(db_path)
    checkpointer = AsyncSqliteSaver(conn)
    await checkpointer.setup()
    
    routes.graph = build_graph().compile(checkpointer=checkpointer)

    logger.info("AstroAgent ready.")
    yield
    await conn.close()
    logger.info("AstroAgent shutting down.")


app = FastAPI(
    title="AstroAgent API",
    description="Agentic AI astrology companion — Aradhana",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware — configured for frontend access
frontend_origin = os.getenv("FRONTEND_ORIGIN", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin] if frontend_origin != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Mount routes
from api.routes import router  # noqa: E402
app.include_router(router)
