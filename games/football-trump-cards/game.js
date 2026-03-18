// Football Stars Trump Cards — Pure Game Engine
// Top football stars with 5 stats each, two modes: All Time & Current Season

const STATS = ["goals", "assists", "trophies", "dribbling", "passing"];

const STAT_LABELS = {
  goals: "Goals",
  assists: "Assists",
  trophies: "Trophies",
  dribbling: "Dribbling",
  passing: "Passing",
};

let cardCounter = 0;

function nextCardId() {
  cardCounter += 1;
  return `f${cardCounter}`;
}

// Visual identity for each player
const PLAYER_VISUALS = {
  // All-Time Legends
  "Lionel Messi":         { colors: ["#75aadb", "#fff"], alias: "MESSI", position: "Forward", img: "messi.jpg" },
  "Cristiano Ronaldo":    { colors: ["#1a472a", "#d4af37"], alias: "CR7", position: "Forward", img: "ronaldo.jpg" },
  "Pele":                 { colors: ["#ffd700", "#006400"], alias: "PELE", position: "Forward", img: "pele.jpg" },
  "Diego Maradona":       { colors: ["#75aadb", "#fff"], alias: "D10S", position: "Forward", img: "maradona.jpg" },
  "Zinedine Zidane":      { colors: ["#002395", "#fff"], alias: "ZIZOU", position: "Midfielder", img: "zidane.jpg" },
  "Ronaldinho":           { colors: ["#ffd700", "#006400"], alias: "R10", position: "Forward", img: "ronaldinho.jpg" },
  "Johan Cruyff":         { colors: ["#ff6600", "#fff"], alias: "CRUYFF", position: "Forward", img: "cruyff.jpg" },
  "Franz Beckenbauer":    { colors: ["#dc143c", "#fff"], alias: "KAISER", position: "Defender", img: "beckenbauer.jpg" },
  "Ronaldo Nazario":      { colors: ["#ffd700", "#006400"], alias: "R9", position: "Forward", img: "ronaldo-nazario.jpg" },
  "Michel Platini":       { colors: ["#002395", "#fff"], alias: "PLATINI", position: "Midfielder", img: "platini.jpg" },
  "Thierry Henry":        { colors: ["#ef0107", "#fff"], alias: "HENRY", position: "Forward", img: "henry.jpg" },
  "Paolo Maldini":        { colors: ["#e00000", "#000"], alias: "MALDINI", position: "Defender", img: "maldini.jpg" },
  "Andrea Pirlo":         { colors: ["#000", "#fff"], alias: "PIRLO", position: "Midfielder", img: "pirlo.jpg" },
  "Xavi Hernandez":       { colors: ["#a50044", "#004d98"], alias: "XAVI", position: "Midfielder", img: "xavi.jpg" },
  "Andres Iniesta":       { colors: ["#a50044", "#004d98"], alias: "INIESTA", position: "Midfielder", img: "iniesta.jpg" },
  // Current Stars
  "Erling Haaland":       { colors: ["#6cabdd", "#fff"], alias: "HAALAND", position: "Forward", img: "haaland.jpg" },
  "Kylian Mbappe":        { colors: ["#002395", "#d4af37"], alias: "MBAPPE", position: "Forward", img: "mbappe.jpg" },
  "Vinicius Jr":          { colors: ["#fff", "#d4af37"], alias: "VINI", position: "Forward", img: "vinicius.jpg" },
  "Jude Bellingham":      { colors: ["#fff", "#d4af37"], alias: "JUDE", position: "Midfielder", img: "bellingham.jpg" },
  "Mohamed Salah":        { colors: ["#c8102e", "#fff"], alias: "SALAH", position: "Forward", img: "salah.jpg" },
  "Kevin De Bruyne":      { colors: ["#6cabdd", "#fff"], alias: "KDB", position: "Midfielder", img: "debruyne.jpg" },
  "Robert Lewandowski":   { colors: ["#a50044", "#004d98"], alias: "LEWY", position: "Forward", img: "lewandowski.jpg" },
  "Luka Modric":          { colors: ["#fff", "#d4af37"], alias: "MODRIC", position: "Midfielder", img: "modric.jpg" },
  "Bukayo Saka":          { colors: ["#ef0107", "#fff"], alias: "SAKA", position: "Forward", img: "saka.jpg" },
  "Rodri":                { colors: ["#6cabdd", "#fff"], alias: "RODRI", position: "Midfielder", img: "rodri.jpg" },
  "Florian Wirtz":        { colors: ["#e32221", "#000"], alias: "WIRTZ", position: "Midfielder", img: "wirtz.jpg" },
  "Lamine Yamal":         { colors: ["#a50044", "#004d98"], alias: "YAMAL", position: "Forward", img: "yamal.jpg" },
  "Phil Foden":           { colors: ["#6cabdd", "#fff"], alias: "FODEN", position: "Midfielder", img: "foden.jpg" },
  "Harry Kane":           { colors: ["#dc143c", "#fff"], alias: "KANE", position: "Forward", img: "kane.jpg" },
  "Neymar Jr":            { colors: ["#ffd700", "#006400"], alias: "NEYMAR", position: "Forward", img: "neymar.jpg" },
  // Additional Current Stars (current season only)
  "Bruno Fernandes":      { colors: ["#da291c", "#fff"], alias: "BRUNO", position: "Midfielder", img: "bruno-fernandes.jpg" },
  "Virgil van Dijk":      { colors: ["#c8102e", "#fff"], alias: "VVD", position: "Defender", img: "van-dijk.jpg" },
  "Pedri":                { colors: ["#a50044", "#004d98"], alias: "PEDRI", position: "Midfielder", img: "pedri.jpg" },
  "Jamal Musiala":        { colors: ["#dc143c", "#fff"], alias: "MUSIALA", position: "Midfielder", img: "musiala.jpg" },
  "Federico Valverde":    { colors: ["#fff", "#d4af37"], alias: "FEDE", position: "Midfielder", img: "valverde.jpg" },
  "Raphinha":             { colors: ["#a50044", "#004d98"], alias: "RAPHINHA", position: "Forward", img: "raphinha.jpg" },
  "Martin Odegaard":      { colors: ["#ef0107", "#fff"], alias: "ODEGAARD", position: "Midfielder", img: "odegaard.jpg" },
  "Bernardo Silva":       { colors: ["#6cabdd", "#fff"], alias: "BERNARDO", position: "Midfielder", img: "bernardo-silva.jpg" },
  "Cole Palmer":          { colors: ["#034694", "#fff"], alias: "PALMER", position: "Forward", img: "cole-palmer.jpg" },
  "Dani Olmo":            { colors: ["#a50044", "#004d98"], alias: "OLMO", position: "Midfielder", img: "dani-olmo.jpg" },
  "Trent Alexander-Arnold": { colors: ["#c8102e", "#fff"], alias: "TRENT", position: "Defender", img: "trent.jpg" },
  "William Saliba":       { colors: ["#ef0107", "#fff"], alias: "SALIBA", position: "Defender", img: "saliba.jpg" },
  "Declan Rice":          { colors: ["#ef0107", "#fff"], alias: "RICE", position: "Midfielder", img: "declan-rice.jpg" },
  "Khvicha Kvaratskhelia":{ colors: ["#002395", "#d4af37"], alias: "KVARA", position: "Forward", img: "kvaratskhelia.jpg" },
  "Alejandro Garnacho":   { colors: ["#da291c", "#fff"], alias: "GARNACHO", position: "Forward", img: "garnacho.jpg" },
};

// All-Time Legends deck — career-level stats (0-100 scale)
const ALL_TIME_DECK = [
  { name: "Lionel Messi", goals: 99, assists: 95, trophies: 98, dribbling: 99, passing: 96 },
  { name: "Cristiano Ronaldo", goals: 99, assists: 82, trophies: 95, dribbling: 90, passing: 80 },
  { name: "Pele", goals: 97, assists: 78, trophies: 99, dribbling: 95, passing: 85 },
  { name: "Diego Maradona", goals: 88, assists: 85, trophies: 82, dribbling: 99, passing: 92 },
  { name: "Zinedine Zidane", goals: 78, assists: 82, trophies: 92, dribbling: 96, passing: 95 },
  { name: "Ronaldinho", goals: 82, assists: 88, trophies: 78, dribbling: 99, passing: 93 },
  { name: "Johan Cruyff", goals: 85, assists: 88, trophies: 82, dribbling: 96, passing: 94 },
  { name: "Franz Beckenbauer", goals: 60, assists: 72, trophies: 95, dribbling: 82, passing: 90 },
  { name: "Ronaldo Nazario", goals: 95, assists: 68, trophies: 80, dribbling: 97, passing: 75 },
  { name: "Michel Platini", goals: 82, assists: 80, trophies: 85, dribbling: 85, passing: 92 },
  { name: "Thierry Henry", goals: 92, assists: 85, trophies: 82, dribbling: 92, passing: 86 },
  { name: "Paolo Maldini", goals: 35, assists: 45, trophies: 96, dribbling: 78, passing: 82 },
  { name: "Andrea Pirlo", goals: 55, assists: 88, trophies: 88, dribbling: 80, passing: 98 },
  { name: "Xavi Hernandez", goals: 58, assists: 92, trophies: 96, dribbling: 85, passing: 99 },
  { name: "Andres Iniesta", goals: 62, assists: 90, trophies: 96, dribbling: 94, passing: 97 },
  { name: "Erling Haaland", goals: 92, assists: 52, trophies: 75, dribbling: 72, passing: 62 },
  { name: "Kylian Mbappe", goals: 90, assists: 72, trophies: 78, dribbling: 95, passing: 78 },
  { name: "Vinicius Jr", goals: 78, assists: 72, trophies: 82, dribbling: 95, passing: 75 },
  { name: "Jude Bellingham", goals: 72, assists: 68, trophies: 72, dribbling: 82, passing: 85 },
  { name: "Mohamed Salah", goals: 90, assists: 78, trophies: 82, dribbling: 90, passing: 78 },
  { name: "Kevin De Bruyne", goals: 72, assists: 95, trophies: 88, dribbling: 82, passing: 96 },
  { name: "Robert Lewandowski", goals: 95, assists: 65, trophies: 85, dribbling: 75, passing: 72 },
  { name: "Luka Modric", goals: 58, assists: 82, trophies: 95, dribbling: 88, passing: 95 },
  { name: "Bukayo Saka", goals: 68, assists: 72, trophies: 55, dribbling: 88, passing: 80 },
  { name: "Rodri", goals: 52, assists: 65, trophies: 88, dribbling: 72, passing: 92 },
  { name: "Florian Wirtz", goals: 65, assists: 72, trophies: 58, dribbling: 90, passing: 88 },
  { name: "Lamine Yamal", goals: 60, assists: 68, trophies: 62, dribbling: 92, passing: 85 },
  { name: "Phil Foden", goals: 72, assists: 68, trophies: 85, dribbling: 88, passing: 85 },
  { name: "Harry Kane", goals: 92, assists: 60, trophies: 62, dribbling: 72, passing: 75 },
  { name: "Neymar Jr", goals: 85, assists: 82, trophies: 78, dribbling: 97, passing: 88 },
];

// Current Season deck — only active players, 2025-26 season form
// These can be overridden by live data
let CURRENT_SEASON_DECK = [
  { name: "Erling Haaland", goals: 95, assists: 48, trophies: 80, dribbling: 70, passing: 58 },
  { name: "Kylian Mbappe", goals: 85, assists: 62, trophies: 72, dribbling: 92, passing: 75 },
  { name: "Vinicius Jr", goals: 82, assists: 68, trophies: 85, dribbling: 95, passing: 72 },
  { name: "Jude Bellingham", goals: 75, assists: 65, trophies: 78, dribbling: 82, passing: 85 },
  { name: "Mohamed Salah", goals: 88, assists: 82, trophies: 72, dribbling: 88, passing: 80 },
  { name: "Kevin De Bruyne", goals: 62, assists: 90, trophies: 75, dribbling: 80, passing: 95 },
  { name: "Robert Lewandowski", goals: 82, assists: 55, trophies: 70, dribbling: 72, passing: 68 },
  { name: "Luka Modric", goals: 48, assists: 72, trophies: 68, dribbling: 82, passing: 92 },
  { name: "Bukayo Saka", goals: 78, assists: 80, trophies: 62, dribbling: 90, passing: 82 },
  { name: "Rodri", goals: 52, assists: 60, trophies: 82, dribbling: 72, passing: 90 },
  { name: "Florian Wirtz", goals: 80, assists: 78, trophies: 65, dribbling: 92, passing: 90 },
  { name: "Lamine Yamal", goals: 75, assists: 80, trophies: 68, dribbling: 95, passing: 85 },
  { name: "Phil Foden", goals: 72, assists: 65, trophies: 78, dribbling: 88, passing: 82 },
  { name: "Harry Kane", goals: 88, assists: 58, trophies: 65, dribbling: 70, passing: 72 },
  { name: "Neymar Jr", goals: 55, assists: 60, trophies: 45, dribbling: 90, passing: 85 },
  { name: "Bruno Fernandes", goals: 72, assists: 85, trophies: 55, dribbling: 78, passing: 88 },
  { name: "Virgil van Dijk", goals: 35, assists: 42, trophies: 78, dribbling: 62, passing: 80 },
  { name: "Pedri", goals: 58, assists: 72, trophies: 72, dribbling: 90, passing: 92 },
  { name: "Jamal Musiala", goals: 72, assists: 68, trophies: 62, dribbling: 94, passing: 85 },
  { name: "Federico Valverde", goals: 65, assists: 62, trophies: 82, dribbling: 80, passing: 82 },
  { name: "Raphinha", goals: 78, assists: 72, trophies: 68, dribbling: 88, passing: 78 },
  { name: "Martin Odegaard", goals: 68, assists: 82, trophies: 58, dribbling: 85, passing: 92 },
  { name: "Bernardo Silva", goals: 62, assists: 75, trophies: 82, dribbling: 90, passing: 90 },
  { name: "Cole Palmer", goals: 82, assists: 78, trophies: 55, dribbling: 85, passing: 82 },
  { name: "Dani Olmo", goals: 70, assists: 72, trophies: 68, dribbling: 82, passing: 88 },
  { name: "Trent Alexander-Arnold", goals: 42, assists: 88, trophies: 75, dribbling: 65, passing: 95 },
  { name: "William Saliba", goals: 30, assists: 35, trophies: 62, dribbling: 68, passing: 78 },
  { name: "Declan Rice", goals: 52, assists: 58, trophies: 58, dribbling: 72, passing: 85 },
  { name: "Khvicha Kvaratskhelia", goals: 72, assists: 68, trophies: 52, dribbling: 92, passing: 78 },
  { name: "Alejandro Garnacho", goals: 65, assists: 58, trophies: 48, dribbling: 88, passing: 72 },
];

let lastLiveUpdate = null;

function makePlayer(name, goals, assists, trophies, dribbling, passing) {
  const visual = PLAYER_VISUALS[name] || { colors: ["#333", "#666"], alias: name.slice(0, 4).toUpperCase(), position: "Player", img: null };
  return {
    id: nextCardId(),
    name,
    goals,
    assists,
    trophies,
    dribbling,
    passing,
    colors: visual.colors,
    alias: visual.alias,
    position: visual.position,
    img: visual.img || null,
  };
}

export function createDeck(mode = "alltime") {
  const source = mode === "current" ? CURRENT_SEASON_DECK : ALL_TIME_DECK;
  return source.map((p) => makePlayer(p.name, p.goals, p.assists, p.trophies, p.dribbling, p.passing));
}

export function updateCurrentSeasonData(newData) {
  if (!Array.isArray(newData) || newData.length === 0) return;
  CURRENT_SEASON_DECK = newData;
  lastLiveUpdate = Date.now();
}

export function getLastLiveUpdate() {
  return lastLiveUpdate;
}

export { PLAYER_VISUALS, STATS, STAT_LABELS };

export function shuffle(deck, rng = Math.random) {
  const array = [...deck];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function pushLog(state, message) {
  state.log = state.log || [];
  state.log.unshift(message);
  if (state.log.length > 50) {
    state.log.length = 50;
  }
}

function nextAlivePlayer(state, fromIndex) {
  const total = state.players.length;
  let idx = fromIndex;
  for (let i = 0; i < total; i += 1) {
    idx = (idx + state.direction + total) % total;
    if (state.players[idx].deck.length > 0) {
      return idx;
    }
  }
  return -1;
}

function checkWinner(state) {
  const alive = state.players.filter((p) => p.deck.length > 0);
  if (alive.length === 1) {
    state.winnerId = alive[0].id;
    state.phase = "finished";
    pushLog(state, `${alive[0].name} wins the match!`);
    return true;
  }
  if (alive.length === 0) {
    let best = state.players[0];
    for (const p of state.players) {
      if (p.totalWon > best.totalWon) best = p;
    }
    state.winnerId = best.id;
    state.phase = "finished";
    pushLog(state, `${best.name} wins with the most cards!`);
    return true;
  }
  return false;
}

export function createGame({ players, options = {} }) {
  cardCounter = 0;
  const gameMode = options.mode || "alltime";
  const deck = shuffle(createDeck(gameMode));
  const gamePlayers = players.map((player) => ({
    id: player.id,
    name: player.name,
    isBot: Boolean(player.isBot),
    deck: [],
    totalWon: 0,
  }));

  const perPlayer = Math.floor(deck.length / gamePlayers.length);
  for (let i = 0; i < perPlayer; i += 1) {
    gamePlayers.forEach((p) => {
      const card = deck.pop();
      if (card) p.deck.push(card);
    });
  }

  const state = {
    players: gamePlayers,
    currentPlayerIndex: 0,
    direction: 1,
    phase: "picking",
    winnerId: null,
    revealedCards: [],
    warPile: [],
    currentStat: null,
    roundWinnerIndex: null,
    log: [],
    options: { ...options, mode: gameMode },
  };

  pushLog(state, `${gameMode === "current" ? "Current Season" : "All-Time Legends"} match begins! ${gamePlayers[0].name} picks first.`);
  return state;
}

export function applyAction(state, action) {
  if (!state) return { state, error: "Game not started." };
  if (state.phase === "finished") return { state, error: "Game finished." };

  const { type, playerId } = action;
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex < 0) return { state, error: "Unknown player." };

  if (type === "pick_stat") {
    if (state.phase !== "picking") return { state, error: "Not in stat picking phase." };
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return { state, error: "Not your turn to pick." };
    const stat = action.stat;
    if (!STATS.includes(stat)) return { state, error: "Invalid stat category." };

    state.currentStat = stat;
    state.phase = "revealing";

    state.revealedCards = [];
    for (let i = 0; i < state.players.length; i += 1) {
      const p = state.players[i];
      if (p.deck.length > 0) {
        const card = p.deck.shift();
        state.revealedCards.push({ playerIndex: i, card });
      }
    }

    pushLog(state, `${currentPlayer.name} picks ${STAT_LABELS[stat]}!`);
    for (const rc of state.revealedCards) {
      const p = state.players[rc.playerIndex];
      pushLog(state, `${p.name}: ${rc.card.name} (${STAT_LABELS[stat]}: ${rc.card[stat]})`);
    }

    let highestValue = -1;
    let winners = [];
    for (const rc of state.revealedCards) {
      const val = rc.card[stat];
      if (val > highestValue) { highestValue = val; winners = [rc]; }
      else if (val === highestValue) { winners.push(rc); }
    }

    const allCards = state.revealedCards.map((rc) => rc.card);

    if (winners.length === 1) {
      const winnerRC = winners[0];
      const winnerPlayer = state.players[winnerRC.playerIndex];
      const wonCards = [...allCards, ...state.warPile];
      const shuffledWon = shuffle(wonCards);
      winnerPlayer.deck.push(...shuffledWon);
      winnerPlayer.totalWon += wonCards.length;
      state.warPile = [];
      state.roundWinnerIndex = winnerRC.playerIndex;
      pushLog(state, `${winnerPlayer.name} wins the round with ${winnerRC.card.name} (${highestValue})! Takes ${wonCards.length} card${wonCards.length !== 1 ? "s" : ""}.`);
      if (!checkWinner(state)) {
        state.currentPlayerIndex = winnerRC.playerIndex;
      }
    } else {
      state.warPile.push(...allCards);
      state.roundWinnerIndex = null;
      const tiedNames = winners.map((w) => state.players[w.playerIndex].name).join(" & ");
      pushLog(state, `TIE between ${tiedNames} at ${highestValue}! ${allCards.length} card${allCards.length !== 1 ? "s" : ""} to war pile (${state.warPile.length} total).`);
      if (!checkWinner(state)) {
        const nextIdx = nextAlivePlayer(state, state.currentPlayerIndex);
        if (nextIdx >= 0) state.currentPlayerIndex = nextIdx;
        else checkWinner(state);
      }
    }
    return { state };
  }

  if (type === "draw_card") {
    if (state.phase !== "revealing") return { state, error: "Not in draw phase." };
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return { state, error: "Not your turn to draw." };
    state.revealedCards = [];
    state.currentStat = null;
    state.roundWinnerIndex = null;
    state.phase = "picking";
    pushLog(state, `${currentPlayer.name} draws a card — pick a stat!`);
    return { state };
  }

  return { state, error: "Unknown action." };
}

export function sanitizeStateForPlayer(state, playerId) {
  return {
    ...state,
    players: state.players.map((player) => ({
      id: player.id,
      name: player.name,
      isBot: player.isBot,
      deckCount: player.deck.length,
      totalWon: player.totalWon,
      topCard: player.id === playerId && player.deck.length > 0 ? player.deck[0] : null,
      deck: player.id === playerId ? player.deck : [],
    })),
  };
}

export function getBotMove(state, playerIndex) {
  const player = state.players[playerIndex];
  if (!player || player.deck.length === 0) return null;

  if (state.phase === "revealing" && state.currentPlayerIndex === playerIndex) {
    return { type: "draw_card", playerId: player.id };
  }

  if (state.phase === "picking" && state.currentPlayerIndex === playerIndex) {
    const topCard = player.deck[0];
    let bestStat = STATS[0];
    let bestVal = topCard[bestStat];
    for (const stat of STATS) {
      if (topCard[stat] > bestVal) { bestVal = topCard[stat]; bestStat = stat; }
    }
    return { type: "pick_stat", playerId: player.id, stat: bestStat };
  }

  return null;
}

export function getPlayableCards() { return []; }
export function getCurrentColor() { return null; }
export function getTopCard() { return null; }
