// Pen Fight — Pure Game Engine
// Physics-based pen flicking on a table arena

const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 500;
const PEN_RADIUS = 8;
const FRICTION = 0.985;
const VELOCITY_THRESHOLD = 0.15;
const MAX_POWER = 18;
const MIN_POWER = 3;
const COLLISION_RESTITUTION = 0.8;
const POINTS_TO_WIN = 3;
const PHYSICS_STEPS = 300; // max steps per flick simulation

const PEN_COLORS = [
  { body: "#2563eb", cap: "#1d4ed8", label: "Blue" },
  { body: "#dc2626", cap: "#b91c1c", label: "Red" },
];

function pushLog(state, message) {
  state.log = state.log || [];
  state.log.unshift(message);
  if (state.log.length > 50) {
    state.log.length = 50;
  }
}

function resetPenPositions(state) {
  const margin = 80;
  state.pens[0].x = margin + PEN_RADIUS;
  state.pens[0].y = ARENA_HEIGHT / 2;
  state.pens[0].vx = 0;
  state.pens[0].vy = 0;
  state.pens[0].angle = 0;
  state.pens[0].offTable = false;

  state.pens[1].x = ARENA_WIDTH - margin - PEN_RADIUS;
  state.pens[1].y = ARENA_HEIGHT / 2;
  state.pens[1].vx = 0;
  state.pens[1].vy = 0;
  state.pens[1].angle = Math.PI;
  state.pens[1].offTable = false;
}

function isPenOffTable(pen) {
  return (
    pen.x - PEN_RADIUS < 0 ||
    pen.x + PEN_RADIUS > ARENA_WIDTH ||
    pen.y - PEN_RADIUS < 0 ||
    pen.y + PEN_RADIUS > ARENA_HEIGHT
  );
}

function simulatePhysicsStep(state) {
  const pens = state.pens;

  // Move pens
  for (const pen of pens) {
    if (pen.offTable) continue;
    pen.x += pen.vx;
    pen.y += pen.vy;
    pen.vx *= FRICTION;
    pen.vy *= FRICTION;

    // Stop if very slow
    if (Math.abs(pen.vx) < VELOCITY_THRESHOLD && Math.abs(pen.vy) < VELOCITY_THRESHOLD) {
      pen.vx = 0;
      pen.vy = 0;
    }
  }

  // Pen-to-pen collision
  const p0 = pens[0];
  const p1 = pens[1];
  if (!p0.offTable && !p1.offTable) {
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = PEN_RADIUS * 2;

    if (dist < minDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;

      // Relative velocity
      const dvx = p0.vx - p1.vx;
      const dvy = p0.vy - p1.vy;
      const dvn = dvx * nx + dvy * ny;

      if (dvn > 0) {
        const impulse = dvn * COLLISION_RESTITUTION;
        p0.vx -= impulse * nx;
        p0.vy -= impulse * ny;
        p1.vx += impulse * nx;
        p1.vy += impulse * ny;
      }

      // Separate overlapping pens
      const overlap = minDist - dist;
      p0.x -= (overlap / 2) * nx;
      p0.y -= (overlap / 2) * ny;
      p1.x += (overlap / 2) * nx;
      p1.y += (overlap / 2) * ny;

      state.collisionOccurred = true;
    }
  }

  // Check off-table
  for (const pen of pens) {
    if (!pen.offTable && isPenOffTable(pen)) {
      pen.offTable = true;
      pen.vx = 0;
      pen.vy = 0;
    }
  }
}

function allPensStopped(state) {
  return state.pens.every(
    (pen) => pen.offTable || (pen.vx === 0 && pen.vy === 0)
  );
}

function resolveRound(state) {
  const p0Off = state.pens[0].offTable;
  const p1Off = state.pens[1].offTable;

  if (p0Off && p1Off) {
    // Both off — no score
    pushLog(state, "Both pens flew off the table! No points awarded.");
  } else if (p0Off) {
    state.scores[1] += 1;
    pushLog(state, `${state.players[0].name}'s pen fell off! ${state.players[1].name} scores!`);
  } else if (p1Off) {
    state.scores[0] += 1;
    pushLog(state, `${state.players[1].name}'s pen fell off! ${state.players[0].name} scores!`);
  } else {
    pushLog(state, "Both pens stayed on the table. No points this round.");
  }

  // Check for winner
  for (let i = 0; i < 2; i++) {
    if (state.scores[i] >= POINTS_TO_WIN) {
      state.phase = "finished";
      state.winnerId = state.players[i].id;
      pushLog(state, `${state.players[i].name} wins the match ${state.scores[i]}-${state.scores[1 - i]}!`);
      return;
    }
  }

  // Reset pens for next round
  resetPenPositions(state);
  state.round += 1;

  // Alternate who goes first each round
  state.currentPlayerIndex = state.round % 2;
  state.flicksThisRound = 0;
  state.phase = "aiming";
  pushLog(state, `Round ${state.round}! ${state.players[state.currentPlayerIndex].name} flicks first.`);
}

export function createGame({ players, options = {} }) {
  const gamePlayers = players.map((player) => ({
    id: player.id,
    name: player.name,
    isBot: Boolean(player.isBot),
  }));

  const state = {
    players: gamePlayers,
    currentPlayerIndex: 0,
    phase: "aiming", // aiming | simulating | roundEnd | finished
    winnerId: null,
    scores: [0, 0],
    round: 1,
    flicksThisRound: 0,
    pens: [
      { x: 0, y: 0, vx: 0, vy: 0, angle: 0, offTable: false, color: PEN_COLORS[0] },
      { x: 0, y: 0, vx: 0, vy: 0, angle: Math.PI, offTable: false, color: PEN_COLORS[1] },
    ],
    arena: { width: ARENA_WIDTH, height: ARENA_HEIGHT },
    penRadius: PEN_RADIUS,
    collisionOccurred: false,
    // For animation playback in app.js
    physicsFrames: [],
    log: [],
    options,
  };

  resetPenPositions(state);
  pushLog(state, `Pen Fight begins! ${gamePlayers[0].name} flicks first.`);

  return state;
}

export function applyAction(state, action) {
  if (!state) return { state, error: "Game not started." };
  if (state.phase === "finished") return { state, error: "Game finished." };

  const { type, playerId } = action;
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex < 0) return { state, error: "Unknown player." };

  if (type === "flick") {
    if (state.phase !== "aiming") return { state, error: "Not in aiming phase." };
    if (state.currentPlayerIndex !== playerIndex) return { state, error: "Not your turn." };

    const pen = state.pens[playerIndex];
    if (pen.offTable) return { state, error: "Your pen is off the table." };

    let { angle, power } = action;
    if (typeof angle !== "number" || typeof power !== "number") {
      return { state, error: "Flick requires angle and power." };
    }

    power = Math.max(MIN_POWER, Math.min(MAX_POWER, power));

    pen.vx = Math.cos(angle) * power;
    pen.vy = Math.sin(angle) * power;
    pen.angle = angle;

    state.collisionOccurred = false;

    pushLog(
      state,
      `${state.players[playerIndex].name} flicks! (power: ${Math.round(power)}, angle: ${Math.round((angle * 180) / Math.PI)}deg)`
    );

    // Record physics frames for animation
    state.physicsFrames = [];
    state.physicsFrames.push({
      pens: state.pens.map((p) => ({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, offTable: p.offTable })),
    });

    // Run full simulation
    for (let step = 0; step < PHYSICS_STEPS; step++) {
      simulatePhysicsStep(state);
      state.physicsFrames.push({
        pens: state.pens.map((p) => ({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, offTable: p.offTable })),
      });
      if (allPensStopped(state)) break;
    }

    state.flicksThisRound += 1;
    state.phase = "simulating"; // app.js will animate, then call "endTurn"

    return { state };
  }

  if (type === "endTurn") {
    if (state.phase !== "simulating") return { state, error: "Not simulating." };

    const anyOff = state.pens[0].offTable || state.pens[1].offTable;

    if (anyOff) {
      // Round over
      state.phase = "roundEnd";
      resolveRound(state);
      return { state };
    }

    // Both pens still on table
    if (state.flicksThisRound >= 2) {
      // Both players flicked — round ends
      state.phase = "roundEnd";
      resolveRound(state);
      return { state };
    }

    // Switch to other player
    state.currentPlayerIndex = 1 - state.currentPlayerIndex;
    state.phase = "aiming";
    pushLog(state, `${state.players[state.currentPlayerIndex].name}'s turn to flick!`);

    return { state };
  }

  return { state, error: "Unknown action." };
}

export function sanitizeStateForPlayer(state, playerId) {
  // Pen Fight has no hidden info, return full state
  return { ...state };
}

export function getBotMove(state, playerIndex) {
  const player = state.players[playerIndex];
  if (!player) return null;

  if (state.phase === "aiming" && state.currentPlayerIndex === playerIndex) {
    const myPen = state.pens[playerIndex];
    const theirPen = state.pens[1 - playerIndex];

    if (myPen.offTable) return null;

    // Aim toward opponent's pen
    const dx = theirPen.x - myPen.x;
    const dy = theirPen.y - myPen.y;
    let angle = Math.atan2(dy, dx);

    // Add some randomness
    angle += (Math.random() - 0.5) * 0.4;

    // Try to push opponent toward nearest edge
    const distToRight = ARENA_WIDTH - theirPen.x;
    const distToLeft = theirPen.x;
    const distToBottom = ARENA_HEIGHT - theirPen.y;
    const distToTop = theirPen.y;
    const minEdgeDist = Math.min(distToRight, distToLeft, distToBottom, distToTop);

    // Stronger flick when opponent is near edge
    let power = 8 + Math.random() * 6;
    if (minEdgeDist < 100) {
      power = 12 + Math.random() * 5;
    }

    return { type: "flick", playerId: player.id, angle, power };
  }

  return null;
}

// Compatibility stubs for the platform
export function getPlayableCards() {
  return [];
}

export function getCurrentColor() {
  return null;
}

export function getTopCard() {
  return null;
}

export { ARENA_WIDTH, ARENA_HEIGHT, PEN_RADIUS, PEN_COLORS, POINTS_TO_WIN };
