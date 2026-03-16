import WebSocket, { WebSocketServer } from "ws";
import { applyAction, createGame, sanitizeStateForPlayer, getBotMove } from "./game.js";

const PORT = Number(process.env.PORT) || 8080;
const wss = new WebSocketServer({ port: PORT });

const rooms = new Map();
let clientCounter = 0;

function send(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastRoom(room) {
  const players = Array.from(room.clients.values()).map((client) => ({
    id: client.id,
    name: client.name,
    isBot: client.isBot,
  }));
  room.clients.forEach((client) => {
    if (client.ws) {
      send(client.ws, {
        type: "room_state",
        room: room.code,
        hostId: room.hostId,
        players,
        started: Boolean(room.state),
      });
    }
  });
}

const TURN_DURATION_MS = 30000;

function broadcastGame(room) {
  room.clients.forEach((client) => {
    if (client.ws) {
      const safeState = sanitizeStateForPlayer(room.state, client.id);
      // Inject turnEndTime into the broadcasted state
      send(client.ws, { 
        type: "game_state", 
        state: { ...safeState, turnEndTime: room.turnEndTime } 
      });
    }
  });

  // Bot & Timer logic
  if (room.state && room.state.phase === "playing") {
    const currentPlayer = room.state.players[room.state.currentPlayerIndex];
    
    // Clear existing timer if any
    if (room.turnTimer) clearTimeout(room.turnTimer);

    const now = Date.now();
    const timeLeft = (room.turnEndTime || (Date.now() + TURN_DURATION_MS)) - now;

    if (currentPlayer.isBot) {
      // Faster turn for bots
      room.turnTimer = setTimeout(() => {
        if (!room.state || room.state.phase !== "playing") return;
        const botAction = getBotMove(room.state, room.state.currentPlayerIndex);
        if (botAction) {
          applyAction(room.state, botAction);
          room.turnEndTime = Date.now() + TURN_DURATION_MS;
          broadcastGame(room);
        }
      }, 1500);
    } else {
      // Auto-play for humans on timeout
      room.turnTimer = setTimeout(() => {
        if (!room.state || room.state.phase !== "playing") return;
        const botAction = getBotMove(room.state, room.state.currentPlayerIndex);
        if (botAction) {
          room.state.log.unshift(`${currentPlayer.name} ran out of time!`);
          applyAction(room.state, botAction);
          room.turnEndTime = Date.now() + TURN_DURATION_MS;
          broadcastGame(room);
        }
      }, Math.max(0, timeLeft));
    }
  }
}

function removeClient(ws) {
  const code = ws.roomCode;
  if (!code || !rooms.has(code)) {
    return;
  }
  const room = rooms.get(code);
  const departing = room.clients.get(ws.id);
  room.clients.delete(ws.id);
  if (room.state && departing) {
    const idx = room.state.players.findIndex(
      (player) => player.id === departing.id
    );
    if (idx >= 0) {
      room.state.players.splice(idx, 1);
      room.state.log.unshift(`${departing.name} left the game.`);
      if (room.state.unoPendingPlayerId === departing.id) {
        room.state.unoPendingPlayerId = null;
        room.state.unoCalled = false;
      }
      if (
        room.state.drawRestriction &&
        room.state.drawRestriction.playerId === departing.id
      ) {
        room.state.drawRestriction = null;
      }
      if (room.state.awaitingColorPlayerId === departing.id) {
        room.state.awaitingColor = false;
        room.state.awaitingColorPlayerId = null;
        const top = room.state.discardPile[room.state.discardPile.length - 1];
        room.state.currentColor = top?.color || "red";
      }
      if (room.state.currentPlayerIndex > idx) {
        room.state.currentPlayerIndex -= 1;
      }
      if (room.state.currentPlayerIndex >= room.state.players.length) {
        room.state.currentPlayerIndex = 0;
      }
      if (room.state.players.length === 1) {
        room.state.winnerId = room.state.players[0].id;
        room.state.phase = "finished";
      }
    }
  }
  if (room.clients.size === 0) {
    rooms.delete(code);
    return;
  }
  if (room.hostId === ws.id) {
    const nextHost = room.clients.values().next().value;
    room.hostId = nextHost.id;
  }
  broadcastRoom(room);
  if (room.state) {
    broadcastGame(room);
  }
}

wss.on("connection", (ws) => {
  const clientId = `u${(clientCounter += 1)}`;
  ws.id = clientId;
  ws.roomCode = null;

  send(ws, { type: "welcome", playerId: clientId });

  ws.on("message", (data) => {
    let message = null;
    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      send(ws, { type: "error", message: "Invalid message format." });
      return;
    }

    if (message.type === "hello") {
      const name = String(message.name || "Player").slice(0, 18);
      const roomCode = String(message.room || "").toUpperCase();
      if (!roomCode) {
        send(ws, { type: "error", message: "Room code required." });
        return;
      }

      if (message.create) {
        if (rooms.has(roomCode)) {
          send(ws, { type: "error", message: "Room already exists." });
          return;
        }
        rooms.set(roomCode, {
          code: roomCode,
          hostId: clientId,
          clients: new Map(),
          state: null,
        });
      }

      const room = rooms.get(roomCode);
      if (!room) {
        send(ws, { type: "error", message: "Room not found." });
        return;
      }
      if (room.state && room.state.phase !== "finished") {
        send(ws, { type: "error", message: "Game already started." });
        return;
      }

      ws.roomCode = roomCode;
      room.clients.set(clientId, { id: clientId, ws, name });
      broadcastRoom(room);
      return;
    }

    if (message.type === "leave") {
      removeClient(ws);
      return;
    }

    if (message.type === "add_bot") {
      const room = rooms.get(ws.roomCode);
      if (room && room.hostId === clientId && room.clients.size < 6) {
        const botId = `bot${Math.floor(Math.random() * 10000)}`;
        room.clients.set(botId, {
          id: botId,
          name: `Bot ${room.clients.size}`,
          isBot: true,
          ws: null,
        });
        broadcastRoom(room);
      }
      return;
    }

    const room = rooms.get(ws.roomCode);
    if (!room) {
      send(ws, { type: "error", message: "Join a room first." });
      return;
    }

    if (message.type === "start_game") {
      if (room.hostId !== clientId) {
        send(ws, { type: "error", message: "Only the host can start." });
        return;
      }
      const options = message.options || {};
      const players = Array.from(room.clients.values()).map((client) => {
        // In Spectator Mode, everyone is treated as a bot by the server logic
        const isBot = client.isBot || Boolean(options.spectator);
        return {
          id: client.id,
          name: client.name,
          isBot: isBot
        };
      });
      if (players.length < 2) {
        send(ws, { type: "error", message: "Need at least 2 players." });
        return;
      }
      room.state = createGame({
        players,
        options: options,
      });
      room.turnEndTime = Date.now() + TURN_DURATION_MS;
      broadcastGame(room);
      return;
    }

    if (!room.state) {
      send(ws, { type: "error", message: "Game has not started yet." });
      return;
    }

    if (
      [
        "play_card",
        "draw_card",
        "pass_turn",
        "choose_color",
        "declare_uno",
        "call_uno",
      ].includes(message.type)
    ) {
      const result = applyAction(room.state, {
        ...message,
        playerId: clientId,
      });
      if (result.error) {
        send(ws, { type: "error", message: result.error });
        return;
      }
      // Reset timer on action
      room.turnEndTime = Date.now() + TURN_DURATION_MS;
      broadcastGame(room);
      return;
    }

    send(ws, { type: "error", message: "Unknown action." });
  });

  ws.on("close", () => {
    removeClient(ws);
  });
});

console.log(`UNO Arena server running on ws://localhost:${PORT}`);
