#!/bin/zsh
# Double-click this file to open Chess Coach on this Mac.
# It builds the app and opens it in your browser. Close this window to stop it.
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
npx vite build && npx vite preview --port 4173 --strictPort --open
