# Game Arena - QA Issues Report

**Date:** 2026-03-18
**Server:** All pages and assets (15 games) serve HTTP 200. No missing files.
**Last Updated:** 2026-03-18 — Fixes applied for C1-C6, H3-H8, M1, M2, M8, M10, M11, L3, L4, UI-2, UI-3, UI-4

---

## CRITICAL Issues

### C1. ~~Server: Path Traversal Vulnerability~~ FIXED
**File:** `server.js:57`
```js
let filePath = join(__dirname, req.url === "/" ? "index.html" : req.url);
```
`req.url` is not sanitized. A request like `GET /../../../etc/passwd` could read files outside the project directory. `join()` does NOT prevent `..` traversal.
**Fix:** Resolve the path and verify it starts with `__dirname`.

### C2. ~~Server: Bot Phase Check Too Narrow~~ FIXED
**File:** `server.js:135`
```js
if (!room.state || room.state.phase !== "playing") return;
```
Bot moves only fire when phase is `"playing"`, but several games use other active phases (`"batting"`, `"chasing"`, `"aiming"`, `"toss_flip"`, `"raja_reveal"`, `"guessing"`, `"waiting"`, `"scoring"`, `"pre_roll"`). The `activePhases` array on line 123 includes `["playing", "picking", "revealing"]` but misses many game-specific phases. This means **bots in online mode will freeze** for Hand Cricket, Book Cricket, Raja Mantri Chor Sipahi, Pen Fight, NPAT, and Business.
**Fix:** Expand `activePhases` to include all game-specific active phases, or change the check to `phase !== "finished"`.

### C3. ~~Ludo: Missing Three-Consecutive-6s Rule~~ FIXED
**File:** `games/ludo/game.js:289-311`
Classic Ludo rules require that rolling three consecutive 6s sends all tokens back to base and forfeits the turn. There is no `consecutiveSixes` counter. Players can chain unlimited 6s for infinite extra turns.
**Fix:** Add a `consecutiveSixes` counter that resets on non-6 roll and triggers penalty at 3.

### C4. ~~Business: Rest House Drains Broke Players Below Zero~~ FIXED
**File:** `games/business/game.js:561-570`
```js
others.forEach((p) => { p.money -= 100; });
```
No check if each player has >= 100. Players can go into negative money without triggering bankruptcy.
**Fix:** Add bankruptcy check for each player after deduction, or skip deduction if player can't pay.

### C5. ~~Dots and Boxes: Tie-Breaking is Arbitrary~~ FIXED
**File:** `games/dots-and-boxes/game.js:196-208`
```js
let best = state.players[0];
for (const p of state.players) { if (p.score > best.score) best = p; }
const tied = state.players.filter((p) => p.score === best.score);
if (tied.length > 1) {
  state.winnerId = best.id; // first player with highest score wins
```
When scores are tied, the first player in the array always wins. The tie case and non-tie case produce the exact same result (same log message too). Should either declare a draw or use a proper tiebreaker.

### C6. ~~UNO: Global `cardCounter` Leaks Across Games~~ FIXED
**File:** `games/uno/game.js:5`
```js
let cardCounter = 0;
```
This is module-level state. In online mode, the server imports this module once. Every new game increments the same counter, so card IDs grow forever (`c1`, `c2`, ... `c500`, ...). While not game-breaking, it means card IDs are never reset and could conflict with assumptions in app.js.
**Fix:** Move counter inside `createGame()` or use a closure.

---

## HIGH Issues

### H1. Server: Human Turn Timer Calls getBotMove for Humans
**File:** `server.js:143-156`
When a human player's turn timer expires, the server calls `getBotMove()` to make a random move for them. This is functional but problematic for games like Business where `getBotMove` makes complex financial decisions (buying property, building houses) that the human player wouldn't have chosen.
**Fix:** For complex games, timeout should auto-pass rather than auto-play bot logic.

### H2. Business: Doubles Logic After Jail Escape
**File:** `games/business/game.js:680-714`
When a player rolls doubles to escape jail, `doublesCount` is reset to 0 (line 684). Then on line 703, `doublesCount` increments to 1 for that same double. So the double that freed them also counts as the first in a new streak. This means a player who escapes jail with doubles needs only 2 more doubles (not 3) to go back to jail. This is technically correct per Monopoly rules but may confuse players since the freedom roll counts.

### H3. ~~Atlas: No Places Starting with 'X' in Database~~ FIXED
**File:** `games/atlas/game.js:56`
Only "Xiamen" and "Xian" exist. If a word ends in 'X', the next player has very limited options. Some letters like Q have only 3-4 entries ("Queenstown", "Quetta", "Quebec", "Qatar", "Quito") which exhaust quickly in long games.

### H4. ~~Hand Cricket: `toss_call` Action Not in Server's Allowed Actions~~ FIXED
**File:** `server.js:328`
```js
"hand-cricket": ["pick_number"],
```
Only `pick_number` is allowed, but the game engine uses `toss_call`, `toss_number`, `choose_role`, and `choose_number`. **Online mode for Hand Cricket is completely broken** - the server will reject all actions except `pick_number` which the engine doesn't recognize.
**Fix:** Add all Hand Cricket actions: `["toss_call", "toss_number", "choose_role", "choose_number"]`

### H5. ~~Book Cricket: `open_page` Cheating Vulnerability~~ FIXED
**File:** `server.js:329`
Same as H4. Server allows `["open_page"]` which IS correct, but the client sends with `page` field that is user-controlled. The engine uses `action.page || generatePageNumber()` (game.js:83), meaning **online players can send any page number they want** to guarantee scoring. This is a cheating vulnerability.
**Fix:** Remove `action.page` from the server-side action and always use `generatePageNumber()`.

### H6. ~~Pen Fight: `endTurn` Action Not in Server's Allowed Actions~~ FIXED
**File:** `server.js:337`
```js
"pen-fight": ["flick"],
```
Only `flick` is allowed but the game engine also requires `endTurn` action to resolve rounds after animation. **Online Pen Fight is partially broken** - after flicking, the client can't send `endTurn`.
**Fix:** Change to `["flick", "endTurn"]`

### H7. ~~Raja Mantri Chor Sipahi: More Than 4 Players Silently Handled~~ FIXED
**File:** `games/raja-mantri-chor-sipahi/game.js:82-94`
The game auto-fills to 4 players with bots if fewer join, but if 5-6 players join in online mode, only the first 4 get roles (ROLES array has exactly 4). The 5th and 6th players would have `role = undefined`.
**Fix:** Cap at 4 players or add extra roles.

### H8. ~~Business: `completedFirstLap` False Positive via Chance Card~~ FIXED
**File:** `games/business/game.js:388`
```js
if (collectGo !== false && dest <= oldPos && dest !== JAIL_POSITION) {
```
If a Chance card moves a player from position 5 to position 0 (START), the check `dest <= oldPos` is true, marking `completedFirstLap = true` even though the player hasn't actually gone around the board. This gives unfair early buying ability.

---

## MEDIUM Issues

### M1. ~~UNO: Deck Exhaustion Edge Case~~ FIXED
**File:** `games/uno/game.js:68-76`
If `drawPile` is empty and `discardPile` has only 1 card (the top card), `refillDrawPile` exits silently. Players who need to draw will draw 0 cards. The game doesn't end or handle this gracefully.

### M2. ~~Server: Rooms Never Expire~~ FIXED
**File:** `server.js:73`
Rooms stay in memory forever if at least one bot remains (bots never disconnect). There's no TTL or cleanup for stale rooms. Over time this causes memory growth.

### M3. UNO: Direction Indicator Misleading in 2-Player
**File:** `games/uno/game.js:459-460`
In 2-player games, Reverse acts as Skip (`pendingSkip = true`). But `state.direction` never changes, which could confuse the UI if it shows a direction arrow.

### M4. Bingo: Sanitize Hides Other Players' Cards
**File:** `games/bingo/game.js:237-246`
`sanitizeStateForPlayer` hides other players' `marked` state (only shows `markedCount`), but in real Bingo players can see each other's cards. This is a design choice but may be unexpected.

### M5. Ludo: `currentPlayerIndex` Redundancy in `state`
**File:** `games/ludo/game.js:149`
`state.currentPlayerIndex` is used for game logic but the server also tracks it separately. No actual bug but could cause sync issues if they diverge.

### M6. Business: Wealth Tax per House is Very Low
**File:** `games/business/game.js:513`
Wealth Tax charges 100 per house and 200 per hotel. Given property prices of 1000-8500 and rents up to 20000, this tax is negligible and barely affects gameplay. Design choice, not a bug.

### M7. ~~NPAT: Letters Pool Missing U, V~~ FIXED (added U, V; Q/X/Y/Z intentionally excluded)
**File:** `games/name-place-animal-thing/game.js:13`
```js
const LETTERS = "ABCDEFGHIJKLMNOPRSTW".split("");
```
Missing Q, U, V, X, Y, Z. This is intentional (hard letters) but limits variety.

### M8. ~~Atlas: Duplicate Entries in PLACES Array~~ FIXED
**File:** `games/atlas/game.js:55-80`
"Osaka", "Ottawa", "Oxford", "Yokohama", "Geneva", "Portland", "Havana", "Adelaide" appear in both the main list and the "additional places" section. The deduplication code (lines 82-91) handles this at runtime, but the source is messy.

### M9. Server: `clientCounter` Never Resets
**File:** `server.js:74`
`let clientCounter = 0` increments forever. After many connections, IDs become large strings. Not a practical problem but indicates no server restart handling.

### M10. ~~Hand Cricket: Win Margin Dead Code~~ FIXED
**File:** `games/hand-cricket/game.js:241`
```js
const margin = 2 - 1; // hardcoded to 1
```
This always shows "wins by 1 wicket" concept but the actual log says "Chased down {target} successfully!" which is fine. The unused `margin` variable is dead code.

### M11. ~~Tic-Tac-Toe: `winnerId` Set to String "draw"~~ FIXED
**File:** `games/tic-tac-toe/game.js:151`
```js
state.winnerId = "draw";
```
All other games set `winnerId` to a player ID or `null`. Using the string `"draw"` is inconsistent with the platform convention and could cause issues if app.js or server.js checks `state.winnerId` against player IDs.

---

## LOW Issues

### L1. All Games: No Input Rate Limiting
No throttling on WebSocket messages. A client could spam thousands of actions per second.

### L2. All Games: No WebSocket Reconnection
If a player's connection drops momentarily, there's no mechanism to rejoin an active game.

### L3. ~~Hub Page: Footer Links to GAME-IDEAS.md Raw File~~ FIXED
**File:** `index.html:242`
```html
<a href="./GAME-IDEAS.md">See more game ideas</a>
```
This serves the raw Markdown file, not rendered HTML. Clicking shows plain text.

### L4. ~~Server: MIME Type Missing for Common Extensions~~ FIXED
**File:** `server.js:45-54`
Missing `.gif`, `.webp`, `.woff`, `.woff2`, `.ttf`, `.mp3`, `.wav`, `.mp4`, `.webm`. Any future assets with these extensions would serve as `application/octet-stream`.

### L5. Business: Bot AI Doesn't Unmortgage Properties
**File:** `games/business/game.js:1000-1041`
Bot's `post_roll` logic tries to build houses and mortgage when broke, but never unmortgages properties even when it has surplus money.

---

## UI / E2E Browser Testing Issues

*72 screenshots taken across all 15 games at desktop (1280x800) and mobile (375x812).*
*Screenshots saved in `tests/screenshots/`.*

### UI-1. UNO: House Rules Checkboxes Lack Visual Toggle State (Desktop)
**File:** `games/uno/app.js` / `games/uno/styles.css`
**Screenshot:** `08-uno-desktop-cards.png`
The house rules ("Auto penalty if UNO is missed", "Enforce Wild Draw Four", "Classic UNO: must play if possible") are plain text with no visible checkbox or toggle UI element. Users cannot tell which rules are enabled or disabled at a glance.

### UI-2. ~~Hand Cricket: ODD/EVEN Buttons Very Low Contrast on Mobile~~ FIXED
**File:** `games/hand-cricket/styles.css`
**Screenshot:** `HC-M-002-mobile-game.png`
The ODD and EVEN toss buttons appear with very faded borders and low-contrast text against the dark green background. On mobile they are hard to see and tap confidently.

### UI-3. ~~NPAT: "Game Logs" Button Overlaps "Start Game" on Mobile~~ FIXED
**File:** `games/name-place-animal-thing/styles.css`
**Screenshot:** `NPAT-M-002-mobile-inputs.png`
At 375px width, the floating "Game Logs" button at bottom-right overlaps with the "Start Game" button at the bottom of the form. Both are in the same visual space.

### UI-4. ~~Book Cricket: "THIS OVER" Text Cut Off at Bottom on Mobile~~ FIXED
**File:** `games/book-cricket/styles.css`
**Screenshot:** `BC-M-002-mobile-layout.png`
On mobile view, the "THIS OVER" section at the bottom of the game area is partially cut off by the viewport edge with no scroll indicator.

### UI-5. FLAMES: Back Link Exists but Styled Differently (NOT A BUG)
**File:** `games/flames/index.html`
**Screenshot:** `FL-001-desktop-load.png`
FLAMES page only has a small "Game Arena" text at the top (centered), unlike all other games which have a "Game Arena" breadcrumb link in the top-left. Inconsistent navigation pattern. Also FLAMES has no Local/Online toggle and no setup panel - it's a completely different layout from all other games.

### UI-6. WWE Trump Cards: E2E Test Could Not Start Game
**Screenshot:** `wwe-trump-cards_setup-screen_desktop_2026-03-18T11-49-24-406Z.png`
Playwright tests failed to find and click "Start Game" button for WWE Trump Cards (button name is "Start Match" instead). The button text is inconsistent across games - some use "Start Game", some "Start Match".

### UI-7. Consistent Color Theming - Each Game Has Different Accent Color
All 15 games use a unique color theme (UNO=purple, Bingo=blue, Hand Cricket=green, FLAMES=pink/purple, TTT=purple, Dots=blue, Atlas=teal, NPAT=cyan, RMCS=purple, WWE=gold/red, Ludo=multi, Business=teal). While visually pleasing, there is no shared design system CSS. Each game duplicates the same CSS patterns (glassmorphism, card layout, tab toggle, bot counter) independently. Not a bug, but increases maintenance burden.

### UI-8. All Games: Setup Panel Takes Up Full Page Height on Desktop
**Screenshots:** All desktop setup screenshots
On desktop, the setup panel (name + options + start button) is vertically centered in a large empty page. The game area below is empty until the game starts. This wastes significant screen real estate and could benefit from a more compact layout or preview.

### UI-9. Bingo Mobile: "Start Game" Button Below Fold
**Screenshot:** `14-bingo-mobile-layout.png`
On mobile, the Bingo options (Dedicated Caller, Auto-mark, Spectator Mode, Auto-call speed) push the "Start Game" button below the visible viewport. Users must scroll to find it.

### UI-10. Atlas: Name Input Pre-filled with "Athens"
**Screenshot:** `AT-004-desktop-chain.png`
The player name input shows "Athens" (a place name) instead of "Player". This appears to be from the E2E test entering text, but if the field retains prior input, it could confuse users.

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 6     |
| HIGH     | 8     |
| MEDIUM   | 11    |
| LOW      | 5     |
| UI/E2E   | 10    |
| **Total**| **40**|

### Testing Coverage

| Test Type | Status |
|-----------|--------|
| All 15 game pages serve HTTP 200 | PASS |
| All game.js, app.js, styles.css serve HTTP 200 | PASS |
| Hub page renders 15 game cards | PASS |
| Desktop screenshots (1280x800) all 15 games | PASS |
| Mobile screenshots (375x812) all 15 games | PASS |
| Local gameplay flow (setup -> start -> play) | PASS for 12/15 games |
| WWE Trump Cards E2E start | FAIL (button name mismatch) |
| Ludo/Business complex flows | PARTIAL (games start, full flow not automated) |
| Online/WebSocket E2E | NOT TESTED (requires 2 browser contexts) |

### Most Impactful Issues to Fix First:
1. **C1** - Path traversal security vulnerability
2. **H4, H7** - Missing server actions break online mode for Hand Cricket and Pen Fight
3. **C2** - Bot phase check breaks bots in online mode for most games
4. **H5** - Book Cricket cheating via custom page numbers
5. **C3** - Ludo missing three-6s rule
6. **C4** - Business Rest House bankruptcy edge case
7. **UI-2, UI-3** - Mobile usability issues (low contrast buttons, overlapping elements)
