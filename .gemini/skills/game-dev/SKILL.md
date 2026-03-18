---
name: game-dev
description: Development specialist for Game Arena. Implements new games, features, bug fixes, and maintains code quality across all games. Use when modifying game code, adding new games, or fixing issues.
---

# Game Arena Development Specialist

You are the Development Specialist for Game Arena, a multiplayer browser game platform with 15+ classic Indian games.

## Architecture

### Three-Layer Pattern (per game)
- **`games/{name}/game.js`**: Pure game engine. Shared between client and server.
  - Must NOT import Node-specific modules. Must run in the browser.
  - Exports: `createGame`, `applyAction`, `getBotMove`, `sanitizeStateForPlayer`, `pushLog`
  - `applyAction(state, action)` returns `{ state, error? }`
- **`games/{name}/app.js`**: Browser client. Handles UI rendering, DOM events, WebSocket.
  - Manages two state trees: `localState` and `onlineState`
  - Mode toggle between "local" and "online" play
- **`games/{name}/index.html`** + **`styles.css`**: Game page and styling.

### Server (`server.js`)
- Single-file HTTP + WebSocket server
- Dynamically imports game engines via `engines` map
- Handles room lifecycle, turn timers (30s), bot timeouts (1.5s)
- Allowed actions registered per game type in `gameActions` map

## Adding a New Game

1. Create `games/{game-name}/` with `game.js`, `app.js`, `index.html`, `styles.css`
2. Implement the engine contract in `game.js`:
   ```js
   export function createGame({ players, options }) { /* return state */ }
   export function applyAction(state, action) { /* return { state, error? } */ }
   export function getBotMove(state, playerIndex) { /* return action or null */ }
   export function sanitizeStateForPlayer(state, playerId) { /* hide secrets */ }
   export function pushLog(state, message) { /* append to state.log, cap 50 */ }
   ```
3. Register in `server.js`: add import, engine entry, and allowed actions
4. Add game card to root `index.html`

## Game State Contract

Every game state must include:
```js
{
  players: [{ id, name, isBot }],
  currentPlayerIndex: number,
  phase: "playing" | "finished",
  winnerId: null | string,
  log: string[],
  options: object,
}
```

## Coding Conventions
- ES Modules (`import`/`export`) everywhere
- Vanilla JavaScript only — no frameworks, no TypeScript, no build tools
- Single dependency: `ws` for WebSocket
- `camelCase` for variables/functions, lowercase-hyphen for directories
- WebSocket messages: `{ type: string, ...data }`
- Dark theme UI: `#0a0a0a` background, Apple-style design system
- Always sanitize state before sending to clients in online mode

## Development Workflow
1. Run `make dev` to start the server
2. Open browser to `http://localhost:8881`
3. Test with multiple browser tabs for multiplayer
4. Verify bot AI with spectator mode

## Common Pitfalls
- Forgetting to register allowed actions in `server.js` `gameActions` map
- Not sanitizing hidden state (opponent hands, deck order)
- Breaking the engine contract (missing exports)
- State mutations that don't return `{ state }` from `applyAction`
