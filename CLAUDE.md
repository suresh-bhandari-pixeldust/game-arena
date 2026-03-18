# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Game Arena is a multiplayer browser game platform built with vanilla JavaScript (ES modules), Node.js HTTP server, and WebSocket (`ws` library) for real-time communication. No frameworks, no build tools, no TypeScript.

## Commands

All commands are in the Makefile:

```bash
make install     # npm install
make dev         # Start server in background (port 8881)
make stop        # Stop background server
make restart     # Restart server
make status      # Check if server is running
make logs        # Tail server logs
make start       # Start in foreground (default port 8888, override with PORT=XXXX)
```

No test runner or linter is configured.

## Architecture

**Server (`server.js`)**: Single file HTTP + WebSocket server. Serves static files and manages game rooms. Rooms are in-memory (no database). Each room has a 5-char alphanumeric code, up to 6 players, with 30-second turn timers enforced server-side.

**Hub (`index.html`)**: Landing page with cards linking to each game.

**Games (`games/{game-name}/`)**: Each game is a self-contained directory with:
- `game.js` — Pure game engine (no DOM). Must export: `createGame({ players, options })`, `applyAction(state, action)`, `getBotMove(state, playerIndex)`, and optionally `sanitizeStateForPlayer(state, playerId)`.
- `app.js` — UI controller handling DOM manipulation, WebSocket connection, local/online mode toggle.
- `index.html` — Game page layout.
- `styles.css` — Game-specific styles.
- `assets/` — Optional images/data.

**Adding a new game**: Create a new `games/{game-name}/` directory following the engine contract above. Register it in `server.js`'s game engine imports and add a card to `index.html`.

## Game Engine Contract

All engines share this interface:
- `createGame({ players, options })` → initial state object
- `applyAction(state, action)` → `{ state, error? }`
- `getBotMove(state, playerIndex)` → action object for bot AI
- `sanitizeStateForPlayer(state, playerId)` → state with hidden info removed (optional)
- `pushLog(state, message)` → appends to `state.log` (max 50 entries)

Game state always includes: `players`, `currentPlayerIndex`, `phase`, `winnerId`, `log`, `options`.

## Client-Side Patterns

- Two parallel state trees in `app.js`: `localState` (single-player) and `onlineState` (multiplayer)
- Mode toggle between "local" and "online" play
- Local games call engine functions directly; online games communicate via WebSocket JSON messages
- Bot moves fire on 1500ms timeout after turn broadcast
- Dark theme (blacks/grays with #f5f5f7 text), gradient headers, Apple PWA meta tags

## WebSocket Protocol

Messages are JSON: `{ type, playerId, ... }`. Key server message types: `hello`, `room_state`, `game_state`, `error`. Client sends game-specific action types (e.g., `play_card`, `draw_card`). Server broadcasts sanitized state to all players after each action.
