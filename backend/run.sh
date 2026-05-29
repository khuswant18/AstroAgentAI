#!/bin/bash
set -e

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run RAG ingestion if not already done
if [ ! -f "chroma_initialized.flag" ]; then
    echo "Running initial RAG ingestion..."
    python3 ingest.py
fi

# Start the API server
echo "Starting AstroAgent API on port 8000..."
python3 -m uvicorn api.main:app --reload --port 8000
