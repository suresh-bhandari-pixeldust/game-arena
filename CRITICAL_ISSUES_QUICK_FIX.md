# Critical Issues - Quick Fix Guide

## The 3 Must-Fix Issues Before Production

### Issue #1: Room Memory Leak (CRITICAL)
**File:** `server.js` (lines 70-212)
**Fix Time:** 15 minutes
**Risk:** Server memory grows unbounded; rooms persist after disconnection

**Root Cause:**
Rooms are only deleted when `room.clients.size === 0`. If a client crashes/disconnects without properly closing, the room may persist forever.

**Quick Fix:**
```javascript
// Add at top of server.js after wss initialization
const ROOM_TTL_MS = 30 * 60 * 1000; // 30 minutes

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - (room.lastActivityAt || room.createdAt) > ROOM_TTL_MS) {
      // Clean up clients
      room.clients.forEach((client) => {
        if (client.ws && client.ws.readyState === WebSocket.OPEN) {
          send(client.ws, { type: "error", message: "Room expired." });
          client.ws.close();
        }
      });
      rooms.delete(code);
      console.log(`Cleaned up expired room: ${code}`);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Update lastActivityAt on every message
// In wss.on("connection", ws => { ... ws.on("message", data => { ... })
//   room.lastActivityAt = Date.now(); // Add this line
```

**Verification:**
```bash
# Monitor rooms in memory
node -e "
const http = require('http');
setInterval(() => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log('Heap:', used.toFixed(2), 'MB');
}, 5000);
"
```

---

### Issue #2: Player Name XSS Vulnerability (CRITICAL)
**File:** `server.js` (line 231)
**Fix Time:** 5 minutes
**Risk:** Player names can contain JavaScript/HTML that executes in other clients' browsers

**Root Cause:**
```javascript
const name = String(message.name || "Player").slice(0, 18);
// ↑ No sanitization, just truncation
```

**Quick Fix - Option A (Simple):**
```javascript
const sanitizeName = (name) => {
  return String(name || "Player")
    .slice(0, 18)
    .replace(/[<>"'&]/g, '') // Remove HTML special chars
    .trim();
};

const name = sanitizeName(message.name);
```

**Quick Fix - Option B (Robust):**
```javascript
const sanitizeName = (name) => {
  const element = document.createElement('div');
  element.textContent = String(name || "Player").slice(0, 18);
  return element.innerHTML; // Safe HTML-encoded version
};
// ↑ This only works in browser. For Node.js, use Option A or:

const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
};

const name = escapeHtml(message.name).slice(0, 18);
```

**Apply Fix at line 231:**
```javascript
// OLD
const name = String(message.name || "Player").slice(0, 18);

// NEW
const name = String(message.name || "Player")
  .slice(0, 18)
  .replace(/[<>"'&]/g, '');
```

**Verification:**
```javascript
// In browser console, try this:
const maliciousName = "<img src=x onerror=\"alert('XSS')\" />";
// Send it as player name
// Verify no alert() executes and name displays as text
```

---

### Issue #3: No Action Parameter Validation (CRITICAL)
**File:** `server.js` (lines 322-358)
**Fix Time:** 30 minutes
**Risk:** Invalid action parameters can crash game engines or corrupt state

**Root Cause:**
```javascript
const allowedActions = gameActions[room.gameType] || gameActions.uno;
if (allowedActions.includes(message.type)) {
  const result = engine.applyAction(room.state, {
    ...message,
    playerId: clientId,
  });
  // ↑ No validation of action parameters (cardId, row, col, etc.)
}
```

**Attack Scenarios:**
1. `{ type: "play_card", cardId: "fake_id_999" }` - Card doesn't exist
2. `{ type: "place_mark", row: -1, col: 999 }` - Out of bounds
3. `{ type: "move_token", tokenIndex: NaN }` - Type confusion
4. `{ type: "submit_names", name1: null, name2: null }` - Null values

**Quick Fix Strategy:**

Create a validation layer per game:
```javascript
// Add this BEFORE calling engine.applyAction()
const validateAction = (gameType, action) => {
  const validators = {
    uno: (a) => {
      if (a.type === "play_card" && typeof a.cardId !== 'string') {
        return "Invalid cardId";
      }
      if (a.type === "choose_color" && !["red", "yellow", "green", "blue"].includes(a.color)) {
        return "Invalid color";
      }
      return null;
    },
    "tic-tac-toe": (a) => {
      if (a.type === "place_mark") {
        if (typeof a.row !== 'number' || a.row < 0 || a.row > 2) return "Invalid row";
        if (typeof a.col !== 'number' || a.col < 0 || a.col > 2) return "Invalid col";
        if (a.variant === "super") {
          if (typeof a.bigRow !== 'number' || a.bigRow < 0 || a.bigRow > 2) return "Invalid bigRow";
          if (typeof a.bigCol !== 'number' || a.bigCol < 0 || a.bigCol > 2) return "Invalid bigCol";
        }
      }
      return null;
    },
    // ... add for other games
  };

  const validator = validators[gameType];
  if (validator) {
    return validator(action);
  }
  return null; // No validator = accept (games validate internally)
};

// At line 347-350, update:
if (allowedActions.includes(message.type)) {
  const validationError = validateAction(room.gameType, message);
  if (validationError) {
    send(ws, { type: "error", message: validationError });
    return;
  }

  const result = engine.applyAction(room.state, {
    ...message,
    playerId: clientId,
  });
  // ... rest of code
}
```

**Immediate Mitigation (No Code Change):**
Trust that game engines have robust validation. Review each engine's `applyAction()` for null checks:

```javascript
// In each game engine:
export function applyAction(state, action) {
  if (!state) return { state, error: "Game not started." };
  if (state.phase === "finished") return { state, error: "Game finished." };

  // ✓ GOOD: Check player exists
  const playerIndex = state.players.findIndex(p => p.id === action.playerId);
  if (playerIndex < 0) return { state, error: "Unknown player." };

  // ✓ GOOD: Validate action type
  if (action.type !== "expected_action") return { state, error: "Unknown action." };

  // ? MISSING IN SOME: Check action parameters
  // Before using action.row, action.col, action.cardId, etc., validate they exist and are in range
}
```

**Verification:**
```bash
# Test with curl or browser console
curl -X GET http://localhost:8881 \
  -H "Content-Type: application/json" \
  -d '{"type": "place_mark", "row": -999, "col": -999}'
# Should return error, not crash
```

---

## Implementation Checklist

- [ ] **Issue #1 - Room TTL:** Add cleanup loop and lastActivityAt tracking
- [ ] **Issue #2 - Name Sanitization:** Apply escapeHtml() function
- [ ] **Issue #3 - Action Validation:** Add per-game validators or trust engine checks

**Estimated Total Time:** 50 minutes

**Testing After Fixes:**
- [ ] Server runs without errors for 5 minutes
- [ ] Join 3 rooms concurrently
- [ ] Send malicious player name, verify safe display
- [ ] Send invalid action parameter, verify error not crash
- [ ] Check memory usage stays stable

---

## Deployment Checklist

Before deploying:

```bash
# 1. Run server for 1 hour, monitor memory
npm start &
# ... play games, monitor memory growth
kill %1

# 2. Test with network tools
# Send malicious payloads and verify handling

# 3. Final verification
curl http://localhost:8881/ | grep -q "Game Arena" && echo "OK"

# 4. Check logs for errors
tail -50 .server.log | grep -i error
```

---

## If You Can Only Fix ONE Issue

**Fix Issue #2 (Name XSS)** - Takes 5 minutes, highest security impact.

```javascript
// server.js, line 231
const name = String(message.name || "Player")
  .slice(0, 18)
  .replace(/[<>"'&]/g, '');
```

This prevents malicious player names from executing JavaScript in other clients' browsers.

---

## Why These 3 Are Critical

1. **Memory Leak (#1):** Production servers will fill memory and crash after days
2. **XSS (#2):** Player can compromise security of all other players immediately
3. **Injection (#3):** Malicious client can crash the server or corrupt game state

All 3 must be fixed before deployment to production.
