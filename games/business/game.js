// Business — Pure Game Engine
// Indian Business Board Game (Monopoly-style) for 2-6 players

// ============================================================
// Board Definition
// ============================================================

const BOARD_SIZE = 40;

const COLOR_GROUPS = {
  brown: { name: "Brown", color: "#8B4513", houseCost: 500 },
  lightBlue: { name: "Light Blue", color: "#87CEEB", houseCost: 500 },
  pink: { name: "Pink", color: "#FF69B4", houseCost: 1000 },
  orange: { name: "Orange", color: "#FF8C00", houseCost: 1000 },
  red: { name: "Red", color: "#DC143C", houseCost: 1500 },
  yellow: { name: "Yellow", color: "#FFD700", houseCost: 1500 },
  green: { name: "Green", color: "#228B22", houseCost: 2000 },
  darkBlue: { name: "Dark Blue", color: "#00008B", houseCost: 2000 },
};

// Full 40-space board
const BOARD = [
  // 0
  { type: "go", name: "START" },
  // 1
  {
    type: "property", name: "Agra", group: "brown", price: 600,
    rent: [20, 100, 300, 900, 1600, 2500],
  },
  // 2
  { type: "social_service", name: "Social Service" },
  // 3
  {
    type: "property", name: "Amritsar", group: "brown", price: 600,
    rent: [40, 200, 600, 1800, 3200, 4500],
  },
  // 4
  { type: "tax", name: "Income Tax", amount: 2000 },
  // 5
  { type: "railway", name: "Mumbai Central", price: 2000 },
  // 6
  {
    type: "property", name: "Patna", group: "lightBlue", price: 1000,
    rent: [60, 300, 900, 2700, 4000, 5500],
  },
  // 7
  { type: "luck", name: "Luck" },
  // 8
  {
    type: "property", name: "Jaipur", group: "lightBlue", price: 1000,
    rent: [60, 300, 900, 2700, 4000, 5500],
  },
  // 9
  {
    type: "property", name: "Srinagar", group: "lightBlue", price: 1200,
    rent: [80, 400, 1000, 3000, 4500, 6000],
  },
  // 10
  { type: "jail", name: "Jail" },
  // 11
  {
    type: "property", name: "Bhopal", group: "pink", price: 1400,
    rent: [100, 500, 1500, 4500, 6250, 7500],
  },
  // 12
  { type: "utility", name: "Electric Company", price: 1500 },
  // 13
  {
    type: "property", name: "Lucknow", group: "pink", price: 1400,
    rent: [100, 500, 1500, 4500, 6250, 7500],
  },
  // 14
  {
    type: "property", name: "Bengaluru", group: "pink", price: 1600,
    rent: [120, 600, 1800, 5000, 7000, 9000],
  },
  // 15
  { type: "railway", name: "Delhi Junction", price: 2000 },
  // 16
  {
    type: "property", name: "Ahmedabad", group: "orange", price: 1800,
    rent: [140, 700, 2000, 5500, 7500, 9500],
  },
  // 17
  { type: "social_service", name: "Social Service" },
  // 18
  {
    type: "property", name: "Pune", group: "orange", price: 1800,
    rent: [140, 700, 2000, 5500, 7500, 9500],
  },
  // 19
  {
    type: "property", name: "Hyderabad", group: "orange", price: 2000,
    rent: [160, 800, 2200, 6000, 8000, 10000],
  },
  // 20
  { type: "free_parking", name: "Free Parking" },
  // 21
  {
    type: "property", name: "Kolkata", group: "red", price: 2200,
    rent: [180, 900, 2500, 7000, 8750, 10500],
  },
  // 22
  { type: "luck", name: "Luck" },
  // 23
  {
    type: "property", name: "Chennai", group: "red", price: 2200,
    rent: [180, 900, 2500, 7000, 8750, 10500],
  },
  // 24
  {
    type: "property", name: "Kanpur", group: "red", price: 2400,
    rent: [200, 1000, 3000, 7500, 9250, 11000],
  },
  // 25
  { type: "railway", name: "Howrah Junction", price: 2000 },
  // 26
  {
    type: "property", name: "Chandigarh", group: "yellow", price: 2600,
    rent: [220, 1100, 3300, 8000, 9750, 11500],
  },
  // 27
  {
    type: "property", name: "Nagpur", group: "yellow", price: 2600,
    rent: [220, 1100, 3300, 8000, 9750, 11500],
  },
  // 28
  { type: "utility", name: "Water Works", price: 1500 },
  // 29
  {
    type: "property", name: "Indore", group: "yellow", price: 2800,
    rent: [240, 1200, 3600, 8500, 10250, 12000],
  },
  // 30
  { type: "go_to_jail", name: "Go To Jail" },
  // 31
  {
    type: "property", name: "Cochin", group: "green", price: 3000,
    rent: [260, 1300, 3900, 9000, 11000, 12750],
  },
  // 32
  {
    type: "property", name: "Darjeeling", group: "green", price: 3000,
    rent: [260, 1300, 3900, 9000, 11000, 12750],
  },
  // 33
  { type: "social_service", name: "Social Service" },
  // 34
  {
    type: "property", name: "Shimla", group: "green", price: 3200,
    rent: [280, 1500, 4500, 10000, 12000, 14000],
  },
  // 35
  { type: "railway", name: "Chennai Central", price: 2000 },
  // 36
  { type: "luck", name: "Luck" },
  // 37
  {
    type: "property", name: "Mysore", group: "darkBlue", price: 3500,
    rent: [350, 1750, 5000, 11000, 13000, 15000],
  },
  // 38
  { type: "tax", name: "Luxury Tax", amount: 1000 },
  // 39
  {
    type: "property", name: "Mumbai", group: "darkBlue", price: 4000,
    rent: [500, 2000, 6000, 14000, 17000, 20000],
  },
];

// Luck cards (Chance equivalent)
const LUCK_CARDS = [
  { text: "Advance to START. Collect ₹1,500.", action: "move_to", dest: 0 },
  { text: "Advance to Mumbai. If you pass START, collect ₹1,500.", action: "move_to", dest: 39 },
  { text: "Advance to Bengaluru. If you pass START, collect ₹1,500.", action: "move_to", dest: 14 },
  { text: "Advance to Kolkata. If you pass START, collect ₹1,500.", action: "move_to", dest: 21 },
  { text: "Advance to the nearest Railway Station.", action: "move_to_nearest", type: "railway" },
  { text: "Advance to the nearest Railway Station.", action: "move_to_nearest", type: "railway" },
  { text: "Advance to the nearest Utility.", action: "move_to_nearest", type: "utility" },
  { text: "Go back 3 spaces.", action: "move_back", spaces: 3 },
  { text: "Go directly to Jail. Do not pass START. Do not collect ₹1,500.", action: "go_to_jail" },
  { text: "Bank pays you dividend of ₹500.", action: "collect", amount: 500 },
  { text: "You won a competition! Collect ₹1,500.", action: "collect", amount: 1500 },
  { text: "Your building loan matures. Collect ₹1,500.", action: "collect", amount: 1500 },
  { text: "Pay poor tax of ₹150.", action: "pay", amount: 150 },
  { text: "Speeding fine ₹150.", action: "pay", amount: 150 },
  { text: "Get Out of Jail Free card. Keep until needed.", action: "jail_free_card" },
  { text: "Make general repairs on all your properties. Pay ₹250 per house and ₹1,000 per hotel.", action: "repair", perHouse: 250, perHotel: 1000 },
];

// Social Service cards (Community Chest equivalent)
const SOCIAL_SERVICE_CARDS = [
  { text: "Advance to START. Collect ₹1,500.", action: "move_to", dest: 0 },
  { text: "Bank error in your favour. Collect ₹2,000.", action: "collect", amount: 2000 },
  { text: "Doctor's fee. Pay ₹500.", action: "pay", amount: 500 },
  { text: "From sale of stock you get ₹500.", action: "collect", amount: 500 },
  { text: "Holiday fund matures. Collect ₹1,000.", action: "collect", amount: 1000 },
  { text: "Income tax refund. Collect ₹200.", action: "collect", amount: 200 },
  { text: "Life insurance matures. Collect ₹1,000.", action: "collect", amount: 1000 },
  { text: "Hospital fees. Pay ₹1,000.", action: "pay", amount: 1000 },
  { text: "School fees. Pay ₹500.", action: "pay", amount: 500 },
  { text: "You inherit ₹1,000.", action: "collect", amount: 1000 },
  { text: "Receive ₹250 consultancy fee.", action: "collect", amount: 250 },
  { text: "You won second prize in a beauty contest! Collect ₹100.", action: "collect", amount: 100 },
  { text: "Go directly to Jail. Do not pass START. Do not collect ₹1,500.", action: "go_to_jail" },
  { text: "Get Out of Jail Free card. Keep until needed.", action: "jail_free_card" },
  { text: "Pay hospital bill of ₹500.", action: "pay", amount: 500 },
  { text: "Assessed for street repairs. Pay ₹400 per house and ₹1,150 per hotel.", action: "repair", perHouse: 400, perHotel: 1150 },
];

const GO_SALARY = 1500;
const STARTING_MONEY = 15000;
const JAIL_POSITION = 10;
const JAIL_FINE = 500;
const MAX_JAIL_TURNS = 3;
const MAX_HOUSES = 5; // 5 = hotel

// ============================================================
// Helpers
// ============================================================

export function pushLog(state, message) {
  state.log = state.log || [];
  state.log.unshift(message);
  if (state.log.length > 50) state.log.length = 50;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getPropertiesInGroup(state, group) {
  const indices = [];
  for (let i = 0; i < BOARD.length; i++) {
    if (BOARD[i].group === group) indices.push(i);
  }
  return indices;
}

function ownsFullGroup(state, playerId, group) {
  const indices = getPropertiesInGroup(state, group);
  return indices.every((i) => {
    const prop = state.properties[i];
    return prop && prop.ownerId === playerId;
  });
}

function countPlayerRailways(state, playerId) {
  let count = 0;
  for (let i = 0; i < BOARD.length; i++) {
    if (BOARD[i].type === "railway" && state.properties[i]?.ownerId === playerId) count++;
  }
  return count;
}

function countPlayerUtilities(state, playerId) {
  let count = 0;
  for (let i = 0; i < BOARD.length; i++) {
    if (BOARD[i].type === "utility" && state.properties[i]?.ownerId === playerId) count++;
  }
  return count;
}

function calculateRent(state, spaceIndex, diceTotal) {
  const space = BOARD[spaceIndex];
  const prop = state.properties[spaceIndex];
  if (!prop || !prop.ownerId || prop.mortgaged) return 0;

  if (space.type === "railway") {
    const count = countPlayerRailways(state, prop.ownerId);
    return [0, 250, 500, 1000, 2000][count] || 0;
  }

  if (space.type === "utility") {
    const count = countPlayerUtilities(state, prop.ownerId);
    const multiplier = count >= 2 ? 10 : 4;
    return diceTotal * multiplier;
  }

  if (space.type === "property") {
    const houses = prop.houses || 0;
    if (houses > 0) {
      return space.rent[houses];
    }
    // Double rent if full group owned with no houses
    const base = space.rent[0];
    if (ownsFullGroup(state, prop.ownerId, space.group)) {
      return base * 2;
    }
    return base;
  }

  return 0;
}

function countHousesAndHotels(state, playerId) {
  let houses = 0;
  let hotels = 0;
  for (let i = 0; i < BOARD.length; i++) {
    const prop = state.properties[i];
    if (prop && prop.ownerId === playerId && prop.houses > 0) {
      if (prop.houses === 5) hotels++;
      else houses += prop.houses;
    }
  }
  return { houses, hotels };
}

function getPlayer(state, playerId) {
  return state.players.find((p) => p.id === playerId);
}

function getPlayerIndex(state, playerId) {
  return state.players.findIndex((p) => p.id === playerId);
}

function nextActivePlayer(state, currentIndex) {
  const total = state.players.length;
  let idx = (currentIndex + 1) % total;
  let attempts = 0;
  while (attempts < total) {
    if (!state.players[idx].bankrupt) return idx;
    idx = (idx + 1) % total;
    attempts++;
  }
  return -1;
}

function checkGameEnd(state) {
  const active = state.players.filter((p) => !p.bankrupt);
  if (active.length <= 1) {
    state.phase = "finished";
    state.winnerId = active.length === 1 ? active[0].id : null;
    if (active.length === 1) {
      pushLog(state, `${active[0].name} wins the game!`);
    }
    return true;
  }
  return false;
}

function goBankrupt(state, player, creditorId) {
  player.bankrupt = true;
  pushLog(state, `${player.name} is bankrupt!`);

  // Transfer all properties
  for (let i = 0; i < BOARD.length; i++) {
    const prop = state.properties[i];
    if (prop && prop.ownerId === player.id) {
      if (creditorId) {
        prop.ownerId = creditorId;
      } else {
        // Bank takes it — clear ownership
        prop.ownerId = null;
        prop.houses = 0;
        prop.mortgaged = false;
      }
    }
  }

  // Transfer jail free cards
  if (creditorId && player.jailFreeCards > 0) {
    const creditor = getPlayer(state, creditorId);
    if (creditor) creditor.jailFreeCards += player.jailFreeCards;
  }
  player.jailFreeCards = 0;
  player.money = 0;
}

function findNearestOfType(position, type) {
  for (let i = 1; i <= BOARD_SIZE; i++) {
    const idx = (position + i) % BOARD_SIZE;
    if (BOARD[idx].type === type) return idx;
  }
  return position;
}

function movePlayerTo(state, player, dest, collectGo) {
  const oldPos = player.position;
  player.position = dest;

  // Check if passed GO
  if (collectGo !== false && dest < oldPos && dest !== JAIL_POSITION) {
    player.money += GO_SALARY;
    pushLog(state, `${player.name} passed START and collected ₹${GO_SALARY.toLocaleString()}`);
  }
}

function processCardAction(state, player, card) {
  pushLog(state, `Card: "${card.text}"`);

  switch (card.action) {
    case "move_to": {
      movePlayerTo(state, player, card.dest, true);
      return "resolve_landing";
    }
    case "move_to_nearest": {
      const dest = findNearestOfType(player.position, card.type);
      movePlayerTo(state, player, dest, true);
      return "resolve_landing";
    }
    case "move_back": {
      const dest = (player.position - card.spaces + BOARD_SIZE) % BOARD_SIZE;
      player.position = dest;
      return "resolve_landing";
    }
    case "go_to_jail": {
      sendToJail(state, player);
      return "turn_over";
    }
    case "collect": {
      player.money += card.amount;
      pushLog(state, `${player.name} collected ₹${card.amount.toLocaleString()}`);
      return "continue";
    }
    case "pay": {
      if (player.money >= card.amount) {
        player.money -= card.amount;
        state.freeParking += card.amount;
        pushLog(state, `${player.name} paid ₹${card.amount.toLocaleString()}`);
      } else {
        player.money -= card.amount;
        state.freeParking += card.amount;
        pushLog(state, `${player.name} must pay ₹${card.amount.toLocaleString()}`);
      }
      return "continue";
    }
    case "jail_free_card": {
      player.jailFreeCards = (player.jailFreeCards || 0) + 1;
      pushLog(state, `${player.name} received a Get Out of Jail Free card`);
      return "continue";
    }
    case "repair": {
      const { houses, hotels } = countHousesAndHotels(state, player.id);
      const total = houses * card.perHouse + hotels * card.perHotel;
      player.money -= total;
      state.freeParking += total;
      pushLog(state, `${player.name} pays ₹${total.toLocaleString()} for repairs (${houses} houses, ${hotels} hotels)`);
      return "continue";
    }
    default:
      return "continue";
  }
}

function sendToJail(state, player) {
  player.position = JAIL_POSITION;
  player.inJail = true;
  player.jailTurns = 0;
  pushLog(state, `${player.name} goes to Jail!`);
}

function resolveLanding(state, player, diceTotal) {
  const space = BOARD[player.position];

  switch (space.type) {
    case "go":
      // Already collected when passing
      state.turnPhase = "post_roll";
      break;

    case "property":
    case "railway":
    case "utility": {
      const prop = state.properties[player.position];
      if (!prop.ownerId) {
        // Unowned — offer to buy
        state.turnPhase = "awaiting_buy";
        pushLog(state, `${player.name} landed on ${space.name} (₹${space.price.toLocaleString()}). Buy or pass?`);
      } else if (prop.ownerId !== player.id) {
        // Pay rent
        if (!prop.mortgaged) {
          const rent = calculateRent(state, player.position, diceTotal);
          const owner = getPlayer(state, prop.ownerId);
          if (owner && !owner.bankrupt) {
            player.money -= rent;
            owner.money += rent;
            pushLog(state, `${player.name} pays ₹${rent.toLocaleString()} rent to ${owner.name} for ${space.name}`);
          }
        } else {
          pushLog(state, `${space.name} is mortgaged. No rent.`);
        }
        state.turnPhase = "post_roll";
      } else {
        pushLog(state, `${player.name} landed on their own property: ${space.name}`);
        state.turnPhase = "post_roll";
      }
      break;
    }

    case "tax":
      player.money -= space.amount;
      state.freeParking += space.amount;
      pushLog(state, `${player.name} pays ₹${space.amount.toLocaleString()} ${space.name}`);
      state.turnPhase = "post_roll";
      break;

    case "luck": {
      const card = state.luckDeck[state.luckIndex];
      state.luckIndex = (state.luckIndex + 1) % state.luckDeck.length;
      state.lastCard = card;
      const result = processCardAction(state, player, card);
      if (result === "resolve_landing") {
        resolveLanding(state, player, diceTotal);
      } else if (result === "turn_over") {
        state.turnPhase = "post_roll";
      } else {
        state.turnPhase = "post_roll";
      }
      break;
    }

    case "social_service": {
      const card = state.socialDeck[state.socialIndex];
      state.socialIndex = (state.socialIndex + 1) % state.socialDeck.length;
      state.lastCard = card;
      const result = processCardAction(state, player, card);
      if (result === "resolve_landing") {
        resolveLanding(state, player, diceTotal);
      } else if (result === "turn_over") {
        state.turnPhase = "post_roll";
      } else {
        state.turnPhase = "post_roll";
      }
      break;
    }

    case "go_to_jail":
      sendToJail(state, player);
      state.turnPhase = "post_roll";
      break;

    case "jail":
      pushLog(state, `${player.name} is just visiting Jail.`);
      state.turnPhase = "post_roll";
      break;

    case "free_parking":
      if (state.freeParking > 0) {
        player.money += state.freeParking;
        pushLog(state, `${player.name} collects ₹${state.freeParking.toLocaleString()} from Free Parking!`);
        state.freeParking = 0;
      } else {
        pushLog(state, `${player.name} rests at Free Parking.`);
      }
      state.turnPhase = "post_roll";
      break;

    default:
      state.turnPhase = "post_roll";
  }
}

// ============================================================
// Public API
// ============================================================

export function createGame({ players, options = {} }) {
  const gamePlayers = players.map((p) => ({
    id: p.id,
    name: p.name,
    isBot: Boolean(p.isBot),
    money: STARTING_MONEY,
    position: 0,
    inJail: false,
    jailTurns: 0,
    jailFreeCards: 0,
    bankrupt: false,
    hasRolled: false,
    doublesCount: 0,
  }));

  // Initialize property ownership
  const properties = {};
  for (let i = 0; i < BOARD.length; i++) {
    const space = BOARD[i];
    if (["property", "railway", "utility"].includes(space.type)) {
      properties[i] = { ownerId: null, houses: 0, mortgaged: false };
    }
  }

  const state = {
    players: gamePlayers,
    currentPlayerIndex: 0,
    phase: "playing",
    turnPhase: "pre_roll", // pre_roll | rolled | awaiting_buy | post_roll
    winnerId: null,
    properties,
    dice: [0, 0],
    lastDiceTotal: 0,
    freeParking: 0,
    luckDeck: shuffle(LUCK_CARDS),
    luckIndex: 0,
    socialDeck: shuffle(SOCIAL_SERVICE_CARDS),
    socialIndex: 0,
    lastCard: null,
    log: [],
    options,
  };

  pushLog(state, `Game begins! ${gamePlayers[0].name} goes first.`);
  return state;
}

export function applyAction(state, action) {
  if (!state) return { state, error: "Game not started." };
  if (state.phase === "finished") return { state, error: "Game is over." };

  const { type, playerId } = action;
  const playerIndex = getPlayerIndex(state, playerId);
  if (playerIndex < 0) return { state, error: "Unknown player." };

  const player = state.players[playerIndex];
  if (player.bankrupt) return { state, error: "You are bankrupt." };

  const currentPlayer = state.players[state.currentPlayerIndex];

  // ── roll_dice ──
  if (type === "roll_dice") {
    if (currentPlayer.id !== playerId) return { state, error: "Not your turn." };
    if (state.turnPhase !== "pre_roll") return { state, error: "You already rolled." };

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    const isDoubles = d1 === d2;

    state.dice = [d1, d2];
    state.lastDiceTotal = total;

    pushLog(state, `${player.name} rolled ${d1} + ${d2} = ${total}${isDoubles ? " (Doubles!)" : ""}`);

    // Handle jail
    if (player.inJail) {
      if (isDoubles) {
        player.inJail = false;
        player.jailTurns = 0;
        player.doublesCount = 0;
        pushLog(state, `${player.name} rolled doubles and gets out of Jail!`);
      } else {
        player.jailTurns++;
        if (player.jailTurns >= MAX_JAIL_TURNS) {
          player.money -= JAIL_FINE;
          player.inJail = false;
          player.jailTurns = 0;
          pushLog(state, `${player.name} pays ₹${JAIL_FINE} fine after ${MAX_JAIL_TURNS} turns in Jail.`);
        } else {
          pushLog(state, `${player.name} stays in Jail. (Turn ${player.jailTurns}/${MAX_JAIL_TURNS})`);
          state.turnPhase = "post_roll";
          return { state };
        }
      }
    }

    if (!player.inJail) {
      // Track doubles
      if (isDoubles) {
        player.doublesCount = (player.doublesCount || 0) + 1;
        if (player.doublesCount >= 3) {
          pushLog(state, `${player.name} rolled 3 doubles in a row — Go to Jail!`);
          sendToJail(state, player);
          player.doublesCount = 0;
          state.turnPhase = "post_roll";
          return { state };
        }
      } else {
        player.doublesCount = 0;
      }

      // Move
      const oldPos = player.position;
      const newPos = (oldPos + total) % BOARD_SIZE;

      // Check passing GO
      if (newPos < oldPos) {
        player.money += GO_SALARY;
        pushLog(state, `${player.name} passed START and collected ₹${GO_SALARY.toLocaleString()}`);
      }

      player.position = newPos;
      pushLog(state, `${player.name} lands on ${BOARD[newPos].name}`);

      // Resolve
      resolveLanding(state, player, total);
    }

    // Check bankruptcy
    if (player.money < 0) {
      state.turnPhase = "post_roll";
    }

    return { state };
  }

  // ── buy_property ──
  if (type === "buy_property") {
    if (currentPlayer.id !== playerId) return { state, error: "Not your turn." };
    if (state.turnPhase !== "awaiting_buy") return { state, error: "No property to buy." };

    const space = BOARD[player.position];
    const prop = state.properties[player.position];

    if (prop.ownerId) return { state, error: "Already owned." };
    if (player.money < space.price) return { state, error: `Not enough money. Need ₹${space.price.toLocaleString()}.` };

    player.money -= space.price;
    prop.ownerId = player.id;
    pushLog(state, `${player.name} bought ${space.name} for ₹${space.price.toLocaleString()}`);

    state.turnPhase = "post_roll";
    return { state };
  }

  // ── decline_property ──
  if (type === "decline_property") {
    if (currentPlayer.id !== playerId) return { state, error: "Not your turn." };
    if (state.turnPhase !== "awaiting_buy") return { state, error: "No property to decline." };

    pushLog(state, `${player.name} passed on ${BOARD[player.position].name}`);
    state.turnPhase = "post_roll";
    return { state };
  }

  // ── build_house ──
  if (type === "build_house") {
    const spaceIndex = action.spaceIndex;
    if (spaceIndex === undefined) return { state, error: "Specify property." };

    const space = BOARD[spaceIndex];
    if (!space || space.type !== "property") return { state, error: "Not a property." };

    const prop = state.properties[spaceIndex];
    if (!prop || prop.ownerId !== playerId) return { state, error: "You don't own this." };
    if (prop.mortgaged) return { state, error: "Property is mortgaged." };
    if (!ownsFullGroup(state, playerId, space.group)) return { state, error: "You need the full color group." };
    if (prop.houses >= MAX_HOUSES) return { state, error: "Max buildings reached." };

    // Even build rule: can't build if other properties in group have fewer houses
    const groupIndices = getPropertiesInGroup(state, space.group);
    const minHouses = Math.min(...groupIndices.map((i) => state.properties[i].houses));
    if (prop.houses > minHouses) return { state, error: "Build evenly across the group first." };

    const cost = COLOR_GROUPS[space.group].houseCost;
    if (player.money < cost) return { state, error: `Need ₹${cost.toLocaleString()} to build.` };

    player.money -= cost;
    prop.houses++;

    const buildingName = prop.houses === 5 ? "a Hotel" : `House ${prop.houses}`;
    pushLog(state, `${player.name} built ${buildingName} on ${space.name} (₹${cost.toLocaleString()})`);

    return { state };
  }

  // ── sell_house ──
  if (type === "sell_house") {
    const spaceIndex = action.spaceIndex;
    if (spaceIndex === undefined) return { state, error: "Specify property." };

    const space = BOARD[spaceIndex];
    if (!space || space.type !== "property") return { state, error: "Not a property." };

    const prop = state.properties[spaceIndex];
    if (!prop || prop.ownerId !== playerId) return { state, error: "You don't own this." };
    if (prop.houses <= 0) return { state, error: "No houses to sell." };

    // Even sell rule
    const groupIndices = getPropertiesInGroup(state, space.group);
    const maxHouses = Math.max(...groupIndices.map((i) => state.properties[i].houses));
    if (prop.houses < maxHouses) return { state, error: "Sell evenly across the group." };

    const refund = Math.floor(COLOR_GROUPS[space.group].houseCost / 2);
    player.money += refund;
    prop.houses--;

    pushLog(state, `${player.name} sold a building on ${space.name} for ₹${refund.toLocaleString()}`);
    return { state };
  }

  // ── mortgage_property ──
  if (type === "mortgage_property") {
    const spaceIndex = action.spaceIndex;
    if (spaceIndex === undefined) return { state, error: "Specify property." };

    const space = BOARD[spaceIndex];
    const prop = state.properties[spaceIndex];
    if (!prop || prop.ownerId !== playerId) return { state, error: "You don't own this." };
    if (prop.mortgaged) return { state, error: "Already mortgaged." };
    if (prop.houses > 0) return { state, error: "Sell all houses first." };

    const value = Math.floor(space.price / 2);
    player.money += value;
    prop.mortgaged = true;

    pushLog(state, `${player.name} mortgaged ${space.name} for ₹${value.toLocaleString()}`);
    return { state };
  }

  // ── unmortgage_property ──
  if (type === "unmortgage_property") {
    const spaceIndex = action.spaceIndex;
    if (spaceIndex === undefined) return { state, error: "Specify property." };

    const space = BOARD[spaceIndex];
    const prop = state.properties[spaceIndex];
    if (!prop || prop.ownerId !== playerId) return { state, error: "You don't own this." };
    if (!prop.mortgaged) return { state, error: "Not mortgaged." };

    const cost = Math.floor(space.price / 2 * 1.1); // 10% interest
    if (player.money < cost) return { state, error: `Need ₹${cost.toLocaleString()} to unmortgage.` };

    player.money -= cost;
    prop.mortgaged = false;

    pushLog(state, `${player.name} unmortgaged ${space.name} for ₹${cost.toLocaleString()}`);
    return { state };
  }

  // ── pay_jail_fine ──
  if (type === "pay_jail_fine") {
    if (currentPlayer.id !== playerId) return { state, error: "Not your turn." };
    if (!player.inJail) return { state, error: "Not in jail." };
    if (state.turnPhase !== "pre_roll") return { state, error: "Can only pay before rolling." };

    if (player.money < JAIL_FINE) return { state, error: `Need ₹${JAIL_FINE} to pay.` };

    player.money -= JAIL_FINE;
    player.inJail = false;
    player.jailTurns = 0;
    pushLog(state, `${player.name} paid ₹${JAIL_FINE} to get out of Jail.`);
    return { state };
  }

  // ── use_jail_card ──
  if (type === "use_jail_card") {
    if (currentPlayer.id !== playerId) return { state, error: "Not your turn." };
    if (!player.inJail) return { state, error: "Not in jail." };
    if (state.turnPhase !== "pre_roll") return { state, error: "Can only use before rolling." };
    if (player.jailFreeCards <= 0) return { state, error: "No Get Out of Jail Free cards." };

    player.jailFreeCards--;
    player.inJail = false;
    player.jailTurns = 0;
    pushLog(state, `${player.name} used a Get Out of Jail Free card!`);
    return { state };
  }

  // ── end_turn ──
  if (type === "end_turn") {
    if (currentPlayer.id !== playerId) return { state, error: "Not your turn." };
    if (state.turnPhase !== "post_roll" && state.turnPhase !== "awaiting_buy") {
      return { state, error: "Roll the dice first." };
    }

    // Auto-decline if still in awaiting_buy
    if (state.turnPhase === "awaiting_buy") {
      pushLog(state, `${player.name} passed on ${BOARD[player.position].name}`);
    }

    // Check bankruptcy
    if (player.money < 0) {
      goBankrupt(state, player, null);
      if (checkGameEnd(state)) return { state };
    }

    // Check for doubles (extra turn)
    const isDoubles = state.dice[0] === state.dice[1] && state.dice[0] > 0;
    if (isDoubles && !player.inJail && !player.bankrupt) {
      state.turnPhase = "pre_roll";
      pushLog(state, `${player.name} gets another turn (doubles)!`);
      return { state };
    }

    // Next player
    player.doublesCount = 0;
    const next = nextActivePlayer(state, state.currentPlayerIndex);
    if (next < 0) {
      checkGameEnd(state);
      return { state };
    }

    state.currentPlayerIndex = next;
    state.turnPhase = "pre_roll";
    state.dice = [0, 0];
    state.lastCard = null;
    pushLog(state, `${state.players[next].name}'s turn.`);

    return { state };
  }

  // ── declare_bankruptcy ──
  if (type === "declare_bankruptcy") {
    goBankrupt(state, player, null);
    pushLog(state, `${player.name} declared bankruptcy.`);

    if (checkGameEnd(state)) return { state };

    // If it's this player's turn, advance
    if (state.currentPlayerIndex === playerIndex) {
      const next = nextActivePlayer(state, state.currentPlayerIndex);
      if (next >= 0) {
        state.currentPlayerIndex = next;
        state.turnPhase = "pre_roll";
        state.dice = [0, 0];
        state.lastCard = null;
        pushLog(state, `${state.players[next].name}'s turn.`);
      }
    }

    return { state };
  }

  return { state, error: "Unknown action." };
}

export function sanitizeStateForPlayer(state, playerId) {
  // Business is mostly open information, but hide card decks
  return {
    ...state,
    luckDeck: undefined,
    socialDeck: undefined,
    players: state.players.map((p) => ({ ...p })),
  };
}

export function getBotMove(state, playerIndex) {
  const player = state.players[playerIndex];
  if (!player || player.bankrupt) return null;
  if (state.currentPlayerIndex !== playerIndex) return null;

  // Handle jail
  if (player.inJail && state.turnPhase === "pre_roll") {
    if (player.jailFreeCards > 0) {
      return { type: "use_jail_card", playerId: player.id };
    }
    if (player.money > JAIL_FINE + 3000) {
      return { type: "pay_jail_fine", playerId: player.id };
    }
    // Just roll (try doubles)
    return { type: "roll_dice", playerId: player.id };
  }

  if (state.turnPhase === "pre_roll") {
    return { type: "roll_dice", playerId: player.id };
  }

  if (state.turnPhase === "awaiting_buy") {
    const space = BOARD[player.position];
    // Buy if affordable and have enough reserve
    if (player.money >= space.price + 1500) {
      return { type: "buy_property", playerId: player.id };
    }
    // Always try to complete a group
    if (player.money >= space.price) {
      const groupIndices = getPropertiesInGroup(state, space.group);
      const owned = groupIndices.filter(
        (i) => state.properties[i]?.ownerId === player.id
      ).length;
      if (owned >= groupIndices.length - 1) {
        return { type: "buy_property", playerId: player.id };
      }
    }
    if (player.money >= space.price && space.price <= player.money * 0.6) {
      return { type: "buy_property", playerId: player.id };
    }
    return { type: "decline_property", playerId: player.id };
  }

  if (state.turnPhase === "post_roll") {
    // Try building houses
    for (let i = 0; i < BOARD.length; i++) {
      const space = BOARD[i];
      if (space.type !== "property") continue;
      const prop = state.properties[i];
      if (!prop || prop.ownerId !== player.id) continue;
      if (prop.mortgaged || prop.houses >= MAX_HOUSES) continue;
      if (!ownsFullGroup(state, player.id, space.group)) continue;

      const cost = COLOR_GROUPS[space.group].houseCost;
      if (player.money >= cost + 2000) {
        // Check even build
        const groupIndices = getPropertiesInGroup(state, space.group);
        const minH = Math.min(...groupIndices.map((gi) => state.properties[gi].houses));
        if (prop.houses <= minH) {
          return { type: "build_house", playerId: player.id, spaceIndex: i };
        }
      }
    }

    // If money is very low, try mortgaging
    if (player.money < 0) {
      for (let i = 0; i < BOARD.length; i++) {
        const prop = state.properties[i];
        if (prop && prop.ownerId === player.id && !prop.mortgaged && prop.houses === 0) {
          return { type: "mortgage_property", playerId: player.id, spaceIndex: i };
        }
      }
      // Sell houses if needed
      for (let i = 0; i < BOARD.length; i++) {
        const prop = state.properties[i];
        if (prop && prop.ownerId === player.id && prop.houses > 0) {
          return { type: "sell_house", playerId: player.id, spaceIndex: i };
        }
      }
      return { type: "declare_bankruptcy", playerId: player.id };
    }

    return { type: "end_turn", playerId: player.id };
  }

  return null;
}

// Compatibility stubs
export function getPlayableCards() { return []; }
export function getCurrentColor() { return null; }
export function getTopCard() { return null; }

// Exports for app
export { BOARD, BOARD_SIZE, COLOR_GROUPS, GO_SALARY, JAIL_POSITION, JAIL_FINE, MAX_HOUSES, STARTING_MONEY, ownsFullGroup, getPropertiesInGroup, calculateRent };
