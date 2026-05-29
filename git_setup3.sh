#!/bin/bash
set -e

# Commit 10
git add frontend/tailwind.config.ts frontend/postcss.config.js frontend/src/*.css
git commit -m "Configure Tailwind CSS and base styles"

# Commit 11
git add frontend/src/types.ts frontend/src/store/
git commit -m "Add Zustand store for chat state and session management"

# Commit 12
git add frontend/src/hooks/
git commit -m "Implement custom useChat hook for SSE streaming and tool events"

# Commit 13
git add frontend/src/components/
git commit -m "Build form and loading indicator UI components"

# Commit 14
git add frontend/src/
git commit -m "Integrate Chat interface and main application layout"

# Commit 15
git add backend/eval/
git commit -m "Add evaluation harness and golden test set"

# Commit 16 (Catch all remaining)
git add .
git commit -m "Apply priority fixes for rate limits, type coercion, and prompt injections"

# Push
git push -u origin main
