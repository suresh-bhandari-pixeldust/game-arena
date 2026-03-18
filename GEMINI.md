# Game Arena - Project Context

## Project Overview
Game Arena is a web-based multiplayer game platform featuring 15+ classic nostalgic Indian games. Built with vanilla JavaScript (ES Modules), a Node.js WebSocket server, and no frameworks or build tools.

### Core Technologies
- **Backend:** Node.js, `ws` (WebSocket library)
- **Frontend:** Vanilla HTML5/CSS3/JavaScript (ESM)
- **Game Logic:** Pure functional game engines in `games/{name}/game.js`
- **Tooling:** `Makefile` for development automation

### Architecture
- **Server (`server.js`):** Single-file HTTP + WebSocket server. Manages rooms, turn timers (30s), bot timeouts (1.5s), and state synchronization. Imports all game engines and dispatches actions dynamically.
- **Game Engine (`games/{name}/game.js`):** Pure logic layer. Exports `createGame`, `applyAction`, `getBotMove`, `sanitizeStateForPlayer`. Must run in both Node.js and browser.
- **Client (`games/{name}/app.js`):** Handles UI rendering, DOM events, local/online mode toggle, and WebSocket communication.
- **Hub (`index.html`):** Landing page with game cards linking to each game.

---

## Building and Running

### Prerequisites
- Node.js (v16+)

### Commands
- **Install:** `npm install` or `make install`
- **Start (background):** `make dev` (port 8881)
- **Start (foreground):** `make start` or `PORT=8888 node server.js`
- **Stop:** `make stop`
- **Status:** `make status`
- **Logs:** `make logs`
- **Clean:** `make clean`

---

## Specialized Agents (Skills)

Two specialized skills for structured task handling:

### 1. Dev Agent (`game-dev`)
- **Responsibility:** Feature implementation, new game creation, bug fixes, architecture
- **When to use:** When modifying game code, adding new games, or fixing issues
- **Key constraint:** Maintain pure functional engines, WebSocket protocol sync, sanitization

### 2. QA Agent (`game-qa`)
- **Responsibility:** Rule verification, bug reproduction, state validation, bot testing
- **When to use:** When validating game behavior, investigating bugs, or stress testing
- **Key approach:** Script-based testing using game engines directly in Node.js

---

## Adding a New Game

1. Create `games/{game-name}/` with: `game.js`, `app.js`, `index.html`, `styles.css`
2. Engine contract exports: `createGame`, `applyAction`, `getBotMove`, `sanitizeStateForPlayer`, `pushLog`
3. Register in `server.js`: import, `engines` map entry, `gameActions` allowed actions
4. Add game card to root `index.html`

## Development Conventions

### Code Style
- **ES Modules** everywhere (`import`/`export`)
- **Functional game engines**: `applyAction` returns `{ state, error? }`
- **Naming:** `camelCase` for code, lowercase-hyphen for directories
- **Single dependency:** `ws` (WebSocket). No frameworks, TypeScript, or build tools.
- **Dark theme UI:** Apple-inspired design, `#0a0a0a` background

### Game State Contract
Every game state includes: `players`, `currentPlayerIndex`, `phase` ("playing" | "finished"), `winnerId`, `log`, `options`

### Network Protocol
- WebSocket JSON messages: `{ type: string, playerId?, ...data }`
- Server broadcasts `room_state` and `game_state` to all players
- `sanitizeStateForPlayer` hides secrets before broadcast

### Current Games (15)
uno, bingo, wwe-trump-cards, football-trump-cards, hand-cricket, book-cricket, flames, tic-tac-toe, dots-and-boxes, name-place-animal-thing, raja-mantri-chor-sipahi, atlas, ludo, pen-fight, business
