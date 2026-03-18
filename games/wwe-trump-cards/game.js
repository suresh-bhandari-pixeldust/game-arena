// WWE Trump Cards — Pure Game Engine
// 30 classic 2000s-era WWE wrestlers with 5 stats each

const STATS = ["strength", "speed", "stamina", "charisma", "finisher"];

const STAT_LABELS = {
  strength: "Strength",
  speed: "Speed",
  stamina: "Stamina",
  charisma: "Charisma",
  finisher: "Finishing Move",
};

let cardCounter = 0;

function nextCardId() {
  cardCounter += 1;
  return `w${cardCounter}`;
}

// Visual identity for each wrestler — colors, signature move, short alias
const WRESTLER_VISUALS = {
  "John Cena":                { colors: ["#0050b5", "#ff8c00"], alias: "CENA", move: "FU / AA", img: "john-cena.jpg" },
  "The Rock":                 { colors: ["#1a1a1a", "#d4af37"], alias: "ROCK", move: "Rock Bottom", img: "the-rock.jpg" },
  "Undertaker":               { colors: ["#2d1b4e", "#6b3fa0"], alias: "TAKER", move: "Tombstone", img: "undertaker.jpg" },
  "Triple H":                 { colors: ["#1c1c1c", "#c5a030"], alias: "HHH", move: "Pedigree", img: "triple-h.jpg" },
  "Rey Mysterio":             { colors: ["#005f2e", "#ffd700"], alias: "REY", move: "619", img: "rey-mysterio.jpg" },
  "Batista":                  { colors: ["#3a0a0a", "#c41e3a"], alias: "BATISTA", move: "Batista Bomb", img: "batista.jpg" },
  "Edge":                     { colors: ["#2a0030", "#ff3366"], alias: "EDGE", move: "Spear", img: "edge.jpg" },
  "Kane":                     { colors: ["#8b0000", "#ff2a00"], alias: "KANE", move: "Chokeslam", img: "kane.jpg" },
  "Big Show":                 { colors: ["#1a1a2e", "#4a90d9"], alias: "SHOW", move: "WMD Punch", img: "big-show.jpg" },
  "Brock Lesnar":             { colors: ["#1a0000", "#cc0000"], alias: "BROCK", move: "F-5", img: "brock-lesnar.jpg" },
  "Stone Cold Steve Austin":  { colors: ["#0a0a0a", "#4ecdc4"], alias: "SCSA", move: "Stone Cold Stunner", img: "stone-cold.jpg" },
  "Shawn Michaels":           { colors: ["#1a1a3e", "#ff69b4"], alias: "HBK", move: "Sweet Chin Music", img: "shawn-michaels.jpg" },
  "Randy Orton":              { colors: ["#0d1b2a", "#778da9"], alias: "ORTON", move: "RKO", img: "randy-orton.jpg" },
  "Jeff Hardy":               { colors: ["#1a0a2e", "#9b59b6"], alias: "HARDY", move: "Swanton Bomb", img: "jeff-hardy.jpg" },
  "Chris Jericho":            { colors: ["#0d2b45", "#e8c547"], alias: "Y2J", move: "Walls of Jericho", img: "chris-jericho.jpg" },
  "Kurt Angle":               { colors: ["#002868", "#bf0a30"], alias: "ANGLE", move: "Angle Slam", img: "kurt-angle.jpg" },
  "Booker T":                 { colors: ["#2d1a00", "#e67e22"], alias: "BOOKER", move: "Book End", img: "booker-t.jpg" },
  "Rob Van Dam":              { colors: ["#004d00", "#00ff41"], alias: "RVD", move: "Five Star Frog Splash", img: "rob-van-dam.jpg" },
  "Goldberg":                 { colors: ["#1a1a1a", "#e0e0e0"], alias: "GOLDBERG", move: "Jackhammer", img: "goldberg.jpg" },
  "The Great Khali":          { colors: ["#3d0c02", "#d35400"], alias: "KHALI", move: "Brain Chop", img: "great-khali.jpg" },
  "CM Punk":                  { colors: ["#1a1a1a", "#e74c3c"], alias: "PUNK", move: "GTS", img: "cm-punk.jpg" },
  "Ric Flair":                { colors: ["#2c003e", "#d4af37"], alias: "FLAIR", move: "Figure Four", img: "ric-flair.jpg" },
  "Mankind":                  { colors: ["#2d2d0d", "#8b7355"], alias: "MANKIND", move: "Mandible Claw", img: "mankind.jpg" },
  "Mark Henry":               { colors: ["#1a0a00", "#8b4513"], alias: "HENRY", move: "World's Strongest Slam", img: "mark-henry.jpg" },
  "Eddie Guerrero":           { colors: ["#006400", "#ff4500"], alias: "EDDIE", move: "Frog Splash", img: "eddie-guerrero.jpg" },
  "Yokozuna":                 { colors: ["#1a0a1a", "#c0392b"], alias: "YOKO", move: "Banzai Drop", img: "yokozuna.jpg" },
  "Andre the Giant":          { colors: ["#1a1a0a", "#bdb76b"], alias: "ANDRE", move: "Body Slam", img: "andre-the-giant.jpg" },
  "Hulk Hogan":               { colors: ["#8b0000", "#ffd700"], alias: "HOGAN", move: "Atomic Leg Drop", img: "hulk-hogan.jpg" },
  "Macho Man Randy Savage":   { colors: ["#4a0080", "#ff6b00"], alias: "MACHO", move: "Flying Elbow", img: "macho-man.jpg" },
  "Ultimate Warrior":         { colors: ["#ff1493", "#00bfff"], alias: "WARRIOR", move: "Gorilla Press", img: "ultimate-warrior.png" },
};

function makeWrestler(name, strength, speed, stamina, charisma, finisher) {
  const visual = WRESTLER_VISUALS[name] || { colors: ["#333", "#666"], alias: name.slice(0, 4).toUpperCase(), move: "Finisher", img: null };
  return {
    id: nextCardId(),
    name,
    strength,
    speed,
    stamina,
    charisma,
    finisher,
    colors: visual.colors,
    alias: visual.alias,
    move: visual.move,
    img: visual.img || null,
  };
}

export function createDeck() {
  return [
    makeWrestler("John Cena", 90, 70, 95, 98, 92),
    makeWrestler("The Rock", 88, 75, 85, 100, 95),
    makeWrestler("Undertaker", 92, 55, 90, 95, 98),
    makeWrestler("Triple H", 89, 65, 88, 90, 90),
    makeWrestler("Rey Mysterio", 55, 98, 80, 88, 85),
    makeWrestler("Batista", 95, 60, 78, 82, 88),
    makeWrestler("Edge", 78, 82, 82, 92, 87),
    makeWrestler("Kane", 93, 50, 85, 75, 82),
    makeWrestler("Big Show", 98, 30, 75, 70, 78),
    makeWrestler("Brock Lesnar", 97, 72, 82, 68, 96),
    makeWrestler("Stone Cold Steve Austin", 87, 70, 88, 99, 94),
    makeWrestler("Shawn Michaels", 75, 90, 82, 97, 97),
    makeWrestler("Randy Orton", 82, 78, 84, 88, 93),
    makeWrestler("Jeff Hardy", 68, 95, 78, 90, 86),
    makeWrestler("Chris Jericho", 80, 82, 86, 94, 84),
    makeWrestler("Kurt Angle", 88, 85, 90, 78, 91),
    makeWrestler("Booker T", 82, 78, 80, 85, 80),
    makeWrestler("Rob Van Dam", 72, 92, 82, 86, 83),
    makeWrestler("Goldberg", 94, 65, 68, 80, 95),
    makeWrestler("The Great Khali", 96, 20, 65, 60, 70),
    makeWrestler("CM Punk", 72, 80, 88, 96, 82),
    makeWrestler("Ric Flair", 70, 60, 78, 98, 75),
    makeWrestler("Mankind", 78, 55, 95, 88, 80),
    makeWrestler("Mark Henry", 100, 25, 80, 62, 76),
    makeWrestler("Eddie Guerrero", 76, 88, 82, 93, 88),
    makeWrestler("Yokozuna", 97, 18, 70, 65, 74),
    makeWrestler("Andre the Giant", 99, 15, 72, 78, 77),
    makeWrestler("Hulk Hogan", 88, 50, 82, 100, 90),
    makeWrestler("Macho Man Randy Savage", 82, 72, 80, 95, 88),
    makeWrestler("Ultimate Warrior", 92, 68, 72, 90, 85),
  ];
}

export { WRESTLER_VISUALS };

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
  const deck = shuffle(createDeck());
  const gamePlayers = players.map((player) => ({
    id: player.id,
    name: player.name,
    isBot: Boolean(player.isBot),
    deck: [],
    totalWon: 0,
  }));

  // Deal cards equally round-robin
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
    phase: "picking", // picking | revealing | finished
    winnerId: null,
    revealedCards: [],  // [{playerIndex, card}]
    warPile: [],        // cards from tied rounds
    currentStat: null,
    roundWinnerIndex: null,
    log: [],
    options: options,
  };

  pushLog(
    state,
    `The match begins! ${gamePlayers[0].name} picks a stat first.`
  );

  return state;
}

export function applyAction(state, action) {
  if (!state) {
    return { state, error: "Game not started." };
  }
  if (state.phase === "finished") {
    return { state, error: "Game finished." };
  }

  const { type, playerId } = action;
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex < 0) {
    return { state, error: "Unknown player." };
  }

  if (type === "pick_stat") {
    if (state.phase !== "picking") {
      return { state, error: "Not in stat picking phase." };
    }
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      return { state, error: "Not your turn to pick." };
    }
    const stat = action.stat;
    if (!STATS.includes(stat)) {
      return { state, error: "Invalid stat category." };
    }

    state.currentStat = stat;
    state.phase = "revealing";

    // Reveal top card from every alive player
    state.revealedCards = [];
    for (let i = 0; i < state.players.length; i += 1) {
      const p = state.players[i];
      if (p.deck.length > 0) {
        const card = p.deck.shift();
        state.revealedCards.push({ playerIndex: i, card });
      }
    }

    pushLog(state, `${currentPlayer.name} picks ${STAT_LABELS[stat]}!`);

    // Log each revealed card
    for (const rc of state.revealedCards) {
      const p = state.players[rc.playerIndex];
      pushLog(
        state,
        `${p.name}: ${rc.card.name} (${STAT_LABELS[stat]}: ${rc.card[stat]})`
      );
    }

    // Determine winner
    let highestValue = -1;
    let winners = [];
    for (const rc of state.revealedCards) {
      const val = rc.card[stat];
      if (val > highestValue) {
        highestValue = val;
        winners = [rc];
      } else if (val === highestValue) {
        winners.push(rc);
      }
    }

    const allCards = state.revealedCards.map((rc) => rc.card);

    if (winners.length === 1) {
      // Clear winner
      const winnerRC = winners[0];
      const winnerPlayer = state.players[winnerRC.playerIndex];

      // Winner takes all revealed cards + war pile
      const wonCards = [...allCards, ...state.warPile];
      const shuffledWon = shuffle(wonCards);
      winnerPlayer.deck.push(...shuffledWon);
      winnerPlayer.totalWon += wonCards.length;
      state.warPile = [];
      state.roundWinnerIndex = winnerRC.playerIndex;

      pushLog(
        state,
        `${winnerPlayer.name} wins the round with ${winnerRC.card.name} (${highestValue})! Takes ${wonCards.length} card${wonCards.length !== 1 ? "s" : ""}.`
      );

      // Check game end — winner picks next stat
      if (!checkWinner(state)) {
        state.currentPlayerIndex = winnerRC.playerIndex;
        // Stay in "revealing" so players see the result before next round
      }
    } else {
      // Tie -- cards go to war pile
      state.warPile.push(...allCards);
      state.roundWinnerIndex = null;

      const tiedNames = winners
        .map((w) => state.players[w.playerIndex].name)
        .join(" & ");
      pushLog(
        state,
        `TIE between ${tiedNames} at ${highestValue}! ${allCards.length} card${allCards.length !== 1 ? "s" : ""} added to the war pile (${state.warPile.length} total).`
      );

      // Check if game can continue — stay in "revealing" for ties too
      if (!checkWinner(state)) {
        const nextIdx = nextAlivePlayer(state, state.currentPlayerIndex);
        if (nextIdx >= 0) {
          state.currentPlayerIndex = nextIdx;
        } else {
          checkWinner(state);
        }
      }
    }

    return { state };
  }

  if (type === "draw_card") {
    if (state.phase !== "revealing") {
      return { state, error: "Not in draw phase." };
    }
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      return { state, error: "Not your turn to draw." };
    }
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
      topCard:
        player.id === playerId && player.deck.length > 0
          ? player.deck[0]
          : null,
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
    // Pick the stat where this card is strongest
    let bestStat = STATS[0];
    let bestVal = topCard[bestStat];
    for (const stat of STATS) {
      if (topCard[stat] > bestVal) {
        bestVal = topCard[stat];
        bestStat = stat;
      }
    }
    return { type: "pick_stat", playerId: player.id, stat: bestStat };
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

export { STATS, STAT_LABELS };
