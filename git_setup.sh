#!/bin/bash
set -e

git init
git branch -m main || git checkout -b main

# Commit 1
git add README.md render.yaml EVALUATION.md
git commit -m "Initial commit: project documentation and deployment configs"

# Commit 2
git add backend/requirements.txt backend/.env.example backend/api/main.py backend/api/schemas.py
git commit -m "Add FastAPI backend setup and base dependencies"

# Commit 3
git add backend/agent/state.py backend/agent/router.py backend/agent/graph.py
git commit -m "Implement LangGraph state, router, and graph definitions"

# Commit 4
git add backend/agent/tools/__init__.py backend/agent/tools/birth_chart.py backend/agent/tools/geocode.py
git commit -m "Add astrology tools: birth chart calculation and geocoding"

# Commit 5
git add backend/agent/tools/daily_transits.py
git commit -m "Implement daily transits tool for current planetary aspects"

# Commit 6
git add backend/agent/tools/knowledge.py backend/ingest.py backend/data/
git commit -m "Integrate ChromaDB RAG and astrological knowledge base"

# Commit 7
git add backend/agent/nodes.py
git commit -m "Implement core agent nodes, intent classification, and safety guardrails"

# Commit 8
git add backend/api/routes.py
git commit -m "Create SSE chat streaming endpoint and session history API"

# Commit 9
git add frontend/package.json frontend/package-lock.json frontend/index.html frontend/vite.config.ts frontend/tsconfig*.json
git commit -m "Set up React frontend project with Vite and TypeScript"

# Commit 10
git add frontend/tailwind.config.js frontend/postcss.config.js frontend/src/index.css frontend/src/App.css
git commit -m "Configure Tailwind CSS and base styles"

# Commit 11
git add frontend/src/types.ts frontend/src/store/
git commit -m "Add Zustand store for chat state and session management"

# Commit 12
git add frontend/src/hooks/
git commit -m "Implement custom useChat hook for SSE streaming and tool events"

# Commit 13
git add frontend/src/components/BirthForm.tsx frontend/src/components/ThinkingIndicator.tsx frontend/src/components/ToolActivity.tsx
git commit -m "Build form and loading indicator UI components"

# Commit 14
git add frontend/src/components/Chat.tsx frontend/src/components/MessageBubble.tsx frontend/src/App.tsx frontend/src/main.tsx
git commit -m "Integrate Chat interface and main application layout"

# Commit 15
git add backend/eval/
git commit -m "Add evaluation harness and golden test set"

# Commit 16 (Catch all remaining)
git add .
git commit -m "Apply priority fixes for rate limits, type coercion, and prompt injections"

# Push
git remote add origin https://github.com/khuswant18/AstroAgentAI.git
git push -u origin main
