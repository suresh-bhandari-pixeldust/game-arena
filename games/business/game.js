// Business — Pure Game Engine
// Indian Business Board Game for 2-6 players
// Authentic Indian rules: roll 12 to start, first lap before buying,
// max 3 houses then hotel, Rest House, Club House, Wealth Tax

// ============================================================
// Board Definition
// ============================================================

const BOARD_SIZE = 40;

const COLOR_GROUPS = {
  brown: { name: "Brown", color: "#8B4513", houseCost: 1000, hotelCost: 1000 },
  lightBlue: { name: "Light Blue", color: "#87CEEB", houseCost: 1500, hotelCost: 1500 },
  pink: { name: "Pink", color: "#FF69B4", houseCost: 2000, hotelCost: 2000 },
  orange: { name: "Orange", color: "#FF8C00", houseCost: 3000, hotelCost: 3000 },
  red: { name: "Red", color: "#DC143C", houseCost: 4000, hotelCost: 4000 },
  yellow: { name: "Yellow", color: "#FFD700", houseCost: 5000, hotelCost: 5000 },
  green: { name: "Green", color: "#228B22", houseCost: 5000, hotelCost: 5000 },
  darkBlue: { name: "Dark Blue", color: "#00008B", houseCost: 6000, hotelCost: 6000 },
};

// Full 40-space board — Indian Business edition
// rent array: [site_only, 1_house, 2_houses, 3_houses, hotel]
const BOARD = [
  // 0
  { type: "go", name: "START" },
  // 1
  {
    type: "property", name: "Guwahati", group: "brown", price: 1000,
    rent: [50, 250, 750, 2000, 4000],
  },
  // 2
  { type: "chance", name: "Chance" },
  // 3
  {
    type: "property", name: "Varanasi", group: "brown", price: 1200,
    rent: [60, 300, 900, 2500, 5000],
  },
  // 4
  { type: "tax", name: "Income Tax", amount: 200 },
  // 5
  { type: "transport", name: "Railway", price: 2000 },
  // 6
  {
    type: "property", name: "Patna", group: "lightBlue", price: 1500,
    rent: [80, 400, 1200, 3000, 5500],
  },
  // 7
  { type: "chance", name: "Chance" },
  // 8
  {
    type: "property", name: "Jaipur", group: "lightBlue", price: 1500,
    rent: [80, 400, 1200, 3000, 5500],
  },
  // 9
  {
    type: "property", name: "Lucknow", group: "lightBlue", price: 1800,
    rent: [100, 500, 1500, 3500, 6000],
  },
  // 10
  { type: "jail", name: "Jail" },
  // 11
  {
    type: "property", name: "Bhopal", group: "pink", price: 2000,
    rent: [120, 600, 1800, 4500, 7000],
  },
  // 12
  { type: "utility", name: "B.E.S.", price: 1500 },
  // 13
  {
    type: "property", name: "Agra", group: "pink", price: 2000,
    rent: [120, 600, 1800, 4500, 7000],
  },
  // 14
  {
    type: "property", name: "Ahmedabad", group: "pink", price: 2200,
    rent: [150, 750, 2000, 5000, 7500],
  },
  // 15
  { type: "transport", name: "Air India", price: 2000 },
  // 16
  {
    type: "property", name: "Pune", group: "orange", price: 2500,
    rent: [170, 850, 2500, 5500, 8000],
  },
  // 17
  { type: "community", name: "Community Chest" },
  // 18
  {
    type: "property", name: "Mysore", group: "orange", price: 2500,
    rent: [170, 850, 2500, 5500, 8000],
  },
  // 19
  {
    type: "property", name: "Hyderabad", group: "orange", price: 2800,
    rent: [200, 1000, 3000, 6000, 8500],
  },
  // 20
  { type: "rest_house", name: "Rest House" },
  // 21
  {
    type: "property", name: "Bengaluru", group: "red", price: 3000,
    rent: [220, 1100, 3300, 7000, 9000],
  },
  // 22
  { type: "chance", name: "Chance" },
  // 23
  {
    type: "property", name: "Chennai", group: "red", price: 3000,
    rent: [220, 1100, 3300, 7000, 9000],
  },
  // 24
  {
    type: "property", name: "Kolkata", group: "red", price: 3500,
    rent: [250, 1250, 3800, 7500, 9500],
  },
  // 25
  { type: "transport", name: "Motorboat", price: 2000 },
  // 26
  {
    type: "property", name: "Chandigarh", group: "yellow", price: 3500,
    rent: [250, 1250, 3800, 7500, 9500],
  },
  // 27
  {
    type: "property", name: "Darjeeling", group: "yellow", price: 3500,
    rent: [250, 1250, 3800, 7500, 9500],
  },
  // 28
  { type: "utility", name: "Water Works", price: 1500 },
  // 29
  {
    type: "property", name: "Shimla", group: "yellow", price: 4000,
    rent: [300, 1500, 4200, 8000, 10000],
  },
  // 30
  { type: "go_to_jail", name: "Go To Jail" },
  // 31
  {
    type: "property", name: "Cochin", group: "green", price: 4500,
    rent: [350, 1750, 5000, 9000, 11000],
  },
  // 32
  {
    type: "property", name: "Nainital", group: "green", price: 4500,
    rent: [350, 1750, 5000, 9000, 11000],
  },
  // 33
  { type: "community", name: "Community Chest" },
  // 34
  {
    type: "property", name: "Srinagar", group: "green", price: 5000,
    rent: [400, 2000, 5500, 10000, 12000],
  },
  // 35
  { type: "transport", name: "B.E.S.T. Bus", price: 2000 },
  // 36
  { type: "chance", name: "Chance" },
  // 37
  {
    type: "property", name: "Delhi", group: "darkBlue", price: 6000,
    rent: [550, 3000, 6000, 11000, 14000],
  },
  // 38
  { type: "wealth_tax", name: "Wealth Tax" },
  // 39
  {
    type: "property", name: "Mumbai", group: "darkBlue", price: 8500,
    rent: [1200, 4000, 8000, 14000, 20000],
  },
];

// Chance cards (in authentic game, printed on board center with dice-roll lookup)
const CHANCE_CARDS = [
  { text: "Advance to START. Collect ₹1,500.", action: "move_to", dest: 0 },
  { text: "Advance to Mumbai. If you pass START, collect ₹1,500.", action: "move_to", dest: 39 },
  { text: "Advance to Bengaluru. If you pass START, collect ₹1,500.", action: "move_to", dest: 21 },
  { text: "Advance to Kolkata. If you pass START, collect ₹1,500.", action: "move_to", dest: 24 },
  { text: "Advance to the nearest Transport.", action: "move_to_nearest", nearType: "transport" },
  { text: "Advance to the nearest Utility.", action: "move_to_nearest", nearType: "utility" },
  { text: "Go back 3 spaces.", action: "move_back", spaces: 3 },
  { text: "Go directly to Jail. Do not pass START.", action: "go_to_jail" },
  { text: "Bank pays you dividend of ₹500.", action: "collect", amount: 500 },
  { text: "You won a competition! Collect ₹1,500.", action: "collect", amount: 1500 },
  { text: "Your building loan matures. Collect ₹1,000.", action: "collect", amount: 1000 },
  { text: "Pay poor tax of ₹150.", action: "pay", amount: 150 },
  { text: "Speeding fine ₹200.", action: "pay", amount: 200 },
  { text: "Get Out of Jail Free card.", action: "jail_free_card" },
  { text: "Repair all properties. Pay ₹250 per house, ₹1,000 per hotel.", action: "repair", perHouse: 250, perHotel: 1000 },
  { text: "Advance to Railway. If you pass START, collect ₹1,500.", action: "move_to", dest: 5 },
];

// Community Chest cards
const COMMUNITY_CARDS = [
  { text: "Advance to START. Collect ₹1,500.", action: "move_to", dest: 0 },
  { text: "Bank error in your favour. Collect ₹2,000.", action: "collect", amount: 2000 },
  { text: "Doctor's fee. Pay ₹500.", action: "pay", amount: 500 },
  { text: "Sale of stock. Collect ₹500.", action: "collect", amount: 500 },
  { text: "Holiday fund matures. Collect ₹1,000.", action: "collect", amount: 1000 },
  { text: "Income tax refund. Collect ₹200.", action: "collect", amount: 200 },
  { text: "Life insurance matures. Collect ₹1,000.", action: "collect", amount: 1000 },
  { text: "Hospital fees. Pay ₹500.", action: "pay", amount: 500 },
  { text: "School fees. Pay ₹300.", action: "pay", amount: 300 },
  { text: "You inherit ₹1,000.", action: "collect", amount: 1000 },
  { text: "Consultancy fee. Collect ₹250.", action: "collect", amount: 250 },
  { text: "Beauty contest prize! Collect ₹100.", action: "collect", amount: 100 },
  { text: "Go directly to Jail. Do not pass START.", action: "go_to_jail" },
  { text: "Get Out of Jail Free card.", action: "jail_free_card" },
  { text: "Club House dues. Pay ₹100 to each player.", action: "pay_each", amount: 100 },
  { text: "Street repairs. Pay ₹400 per house, ₹1,150 per hotel.", action: "repair", perHouse: 400, perHotel: 1150 },
];

const GO_SALARY = 1500;
const STARTING_MONEY = 15000;
const JAIL_POSITION = 10;
const JAIL_FINE = 200;
const MAX_JAIL_TURNS = 3;
const MAX_HOUSES = 3; // Indian Business: max 3 houses, then hotel
const HOTEL_LEVEL = 4; // houses=4 means hotel
const ROLL_TO_START = 12; // Must roll 12 (double 6) to start moving

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

function countPlayerTransports(state, playerId) {
  let count = 0;
  for (let i = 0; i < BOARD.length; i++) {
    if (BOARD[i].type === "transport" && state.properties[i]?.ownerId === playerId) count++;
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

  if (space.type === "transport") {
    const count = countPlayerTransports(state, prop.ownerId);
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
      return space.rent[Math.min(houses, space.rent.length - 1)];
    }
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
      if (prop.houses === HOTEL_LEVEL) hotels++;
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

  for (let i = 0; i < BOARD.length; i++) {
    const prop = state.properties[i];
    if (prop && prop.ownerId === player.id) {
      if (creditorId) {
        prop.ownerId = creditorId;
      } else {
        prop.ownerId = null;
        prop.houses = 0;
        prop.mortgaged = false;
      }
    }
  }

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

  // Only count as passing GO if player actually traversed forward past position 0
  // (dest < oldPos means they wrapped around the board)
  if (collectGo !== false && dest < oldPos && dest !== JAIL_POSITION && player.started) {
    if (!player.completedFirstLap) {
      player.completedFirstLap = true;
      pushLog(state, `${player.name} completed the first lap! Can now buy properties.`);
    }
    player.money += GO_SALARY;
    pushLog(state, `${player.name} passed START and collected ₹${GO_SALARY.toLocaleString()}`);
  }
}

function sendToJail(state, player) {
  player.position = JAIL_POSITION;
  player.inJail = true;
  player.jailTurns = 0;
  pushLog(state, `${player.name} goes to Jail!`);
}

function processCardAction(state, player, card) {
  pushLog(state, `Card: "${card.text}"`);

  switch (card.action) {
    case "move_to": {
      movePlayerTo(state, player, card.dest, true);
      return "resolve_landing";
    }
    case "move_to_nearest": {
      const dest = findNearestOfType(player.position, card.nearType);
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
      player.money -= card.amount;
      state.restHousePool += card.amount;
      pushLog(state, `${player.name} paid ₹${card.amount.toLocaleString()}`);
      return "continue";
    }
    case "pay_each": {
      const others = state.players.filter((p) => p.id !== player.id && !p.bankrupt);
      const total = card.amount * others.length;
      player.money -= total;
      others.forEach((p) => { p.money += card.amount; });
      pushLog(state, `${player.name} paid ₹${card.amount} to each player (₹${total} total)`);
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
      state.restHousePool += total;
      pushLog(state, `${player.name} pays ₹${total.toLocaleString()} for repairs (${houses} houses, ${hotels} hotels)`);
      return "continue";
    }
    default:
      return "continue";
  }
}

function resolveLanding(state, player, diceTotal) {
  const space = BOARD[player.position];

  switch (space.type) {
    case "go":
      state.turnPhase = "post_roll";
      break;

    case "property":
    case "transport":
    case "utility": {
      const prop = state.properties[player.position];
      if (!prop.ownerId) {
        if (!player.completedFirstLap) {
          pushLog(state, `${player.name} landed on ${space.name} but hasn't completed the first lap yet.`);
          state.turnPhase = "post_roll";
        } else {
          state.turnPhase = "awaiting_buy";
          pushLog(state, `${player.name} landed on ${space.name} (₹${space.price.toLocaleString()}). Buy or pass?`);
        }
      } else if (prop.ownerId !== player.id) {
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
      state.restHousePool += space.amount;
      pushLog(state, `${player.name} pays ₹${space.amount.toLocaleString()} Income Tax`);
      state.turnPhase = "post_roll";
      break;

    case "wealth_tax": {
      const { houses, hotels } = countHousesAndHotels(state, player.id);
      const tax = houses * 100 + hotels * 200;
      if (tax > 0) {
        player.money -= tax;
        state.restHousePool += tax;
        pushLog(state, `${player.name} pays ₹${tax.toLocaleString()} Wealth Tax (${houses} houses, ${hotels} hotels)`);
      } else {
        pushLog(state, `${player.name} pays no Wealth Tax (no buildings).`);
      }
      state.turnPhase = "post_roll";
      break;
    }

    case "chance": {
      const card = state.chanceDeck[state.chanceIndex];
      state.chanceIndex = (state.chanceIndex + 1) % state.chanceDeck.length;
      state.lastCard = card;
      const result = processCardAction(state, player, card);
      if (result === "resolve_landing") {
        resolveLanding(state, player, diceTotal);
      } else {
        state.turnPhase = "post_roll";
      }
      break;
    }

    case "community": {
      const card = state.communityDeck[state.communityIndex];
      state.communityIndex = (state.communityIndex + 1) % state.communityDeck.length;
      state.lastCard = card;
      const result = processCardAction(state, player, card);
      if (result === "resolve_landing") {
        resolveLanding(state, player, diceTotal);
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

    case "rest_house": {
      // Indian Business: skip next turn, collect ₹100 from each player
      const others = state.players.filter((p) => p.id !== player.id && !p.bankrupt);
      let collected = 0;
      others.forEach((p) => {
        const payment = Math.min(100, Math.max(0, p.money));
        p.money -= payment;
        collected += payment;
      });
      player.money += collected;
      player.skipNextTurn = true;
      pushLog(state, `${player.name} rests at Rest House! Collects ₹${collected} from other players. Skips next turn.`);
      state.turnPhase = "post_roll";
      break;
    }

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
    doublesCount: 0,
    started: false, // hasn't rolled 12 yet
    completedFirstLap: false, // hasn't passed GO yet
    skipNextTurn: false, // Rest House effect
  }));

  const properties = {};
  for (let i = 0; i < BOARD.length; i++) {
    const space = BOARD[i];
    if (["property", "transport", "utility"].includes(space.type)) {
      properties[i] = { ownerId: null, houses: 0, mortgaged: false };
    }
  }

  const state = {
    players: gamePlayers,
    currentPlayerIndex: 0,
    phase: "playing",
    turnPhase: "pre_roll",
    winnerId: null,
    properties,
    dice: [0, 0],
    lastDiceTotal: 0,
    restHousePool: 0,
    chanceDeck: shuffle(CHANCE_CARDS),
    chanceIndex: 0,
    communityDeck: shuffle(COMMUNITY_CARDS),
    communityIndex: 0,
    lastCard: null,
    log: [],
    options,
  };

  pushLog(state, `Game begins! ${gamePlayers[0].name} goes first.`);
  pushLog(state, `Roll a 12 (double sixes) to start moving!`);
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

    // Check skip turn (Rest House effect)
    if (player.skipNextTurn) {
      player.skipNextTurn = false;
      pushLog(state, `${player.name} skips this turn (resting at Rest House).`);
      state.turnPhase = "post_roll";
      return { state };
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    const isDoubles = d1 === d2;

    state.dice = [d1, d2];
    state.lastDiceTotal = total;

    pushLog(state, `${player.name} rolled ${d1} + ${d2} = ${total}${isDoubles ? " (Doubles!)" : ""}`);

    // ── Indian Business rule: must roll 12 to start ──
    if (!player.started) {
      if (total === ROLL_TO_START) {
        player.started = true;
        pushLog(state, `${player.name} rolled 12! They can now start moving!`);
      } else {
        pushLog(state, `${player.name} needs to roll 12 to start. (Rolled ${total})`);
      }
      state.turnPhase = "post_roll";
      return { state };
    }

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
      // Track doubles — 3 consecutive = jail ("over-speeding")
      if (isDoubles) {
        player.doublesCount = (player.doublesCount || 0) + 1;
        if (player.doublesCount >= 3) {
          pushLog(state, `${player.name} rolled 3 doubles — Over-speeding! Go to Jail!`);
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

      // Check passing GO — mark first lap complete
      if (newPos < oldPos) {
        if (!player.completedFirstLap) {
          player.completedFirstLap = true;
          pushLog(state, `${player.name} completed the first lap! Can now buy properties.`);
        }
        player.money += GO_SALARY;
        pushLog(state, `${player.name} passed START and collected ₹${GO_SALARY.toLocaleString()}`);
      }

      player.position = newPos;
      pushLog(state, `${player.name} lands on ${BOARD[newPos].name}`);

      resolveLanding(state, player, total);
    }

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
    if (!player.completedFirstLap) return { state, error: "Complete first lap before buying." };
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

  // ── build_house ── (3 houses max, then hotel at level 4)
  if (type === "build_house") {
    const spaceIndex = action.spaceIndex;
    if (spaceIndex === undefined) return { state, error: "Specify property." };

    const space = BOARD[spaceIndex];
    if (!space || space.type !== "property") return { state, error: "Not a property." };

    const prop = state.properties[spaceIndex];
    if (!prop || prop.ownerId !== playerId) return { state, error: "You don't own this." };
    if (prop.mortgaged) return { state, error: "Property is mortgaged." };
    if (!ownsFullGroup(state, playerId, space.group)) return { state, error: "You need the full color group." };
    if (prop.houses >= HOTEL_LEVEL) return { state, error: "Max buildings reached (hotel)." };

    // Even build rule
    const groupIndices = getPropertiesInGroup(state, space.group);
    const minHouses = Math.min(...groupIndices.map((i) => state.properties[i].houses));
    if (prop.houses > minHouses) return { state, error: "Build evenly across the group first." };

    const isHotel = prop.houses === MAX_HOUSES;
    const cost = isHotel ? COLOR_GROUPS[space.group].hotelCost : COLOR_GROUPS[space.group].houseCost;
    if (player.money < cost) return { state, error: `Need ₹${cost.toLocaleString()} to build.` };

    player.money -= cost;
    prop.houses++;

    const buildingName = prop.houses === HOTEL_LEVEL ? "a Hotel" : `House ${prop.houses}`;
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

    const groupIndices = getPropertiesInGroup(state, space.group);
    const maxHouses = Math.max(...groupIndices.map((i) => state.properties[i].houses));
    if (prop.houses < maxHouses) return { state, error: "Sell evenly across the group." };

    const isHotel = prop.houses === HOTEL_LEVEL;
    const cost = isHotel ? COLOR_GROUPS[space.group].hotelCost : COLOR_GROUPS[space.group].houseCost;
    const refund = Math.floor(cost / 2);
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
    if (prop.houses > 0) return { state, error: "Sell all buildings first." };

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

    const cost = Math.floor(space.price / 2 * 1.1);
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

    if (state.turnPhase === "awaiting_buy") {
      pushLog(state, `${player.name} passed on ${BOARD[player.position].name}`);
    }

    if (player.money < 0) {
      goBankrupt(state, player, null);
      if (checkGameEnd(state)) return { state };
    }

    // Doubles = extra turn (but not if player hasn't started, is in jail, or bankrupt)
    const isDoubles = state.dice[0] === state.dice[1] && state.dice[0] > 0;
    if (isDoubles && player.started && !player.inJail && !player.bankrupt && !player.skipNextTurn) {
      state.turnPhase = "pre_roll";
      pushLog(state, `${player.name} gets another turn (doubles)!`);
      return { state };
    }

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
  return {
    ...state,
    chanceDeck: undefined,
    communityDeck: undefined,
    players: state.players.map((p) => ({ ...p })),
  };
}

export function getBotMove(state, playerIndex) {
  const player = state.players[playerIndex];
  if (!player || player.bankrupt) return null;
  if (state.currentPlayerIndex !== playerIndex) return null;

  if (player.inJail && state.turnPhase === "pre_roll") {
    if (player.jailFreeCards > 0) return { type: "use_jail_card", playerId: player.id };
    if (player.money > JAIL_FINE + 3000) return { type: "pay_jail_fine", playerId: player.id };
    return { type: "roll_dice", playerId: player.id };
  }

  if (state.turnPhase === "pre_roll") {
    return { type: "roll_dice", playerId: player.id };
  }

  if (state.turnPhase === "awaiting_buy") {
    const space = BOARD[player.position];
    if (player.money >= space.price + 2000) return { type: "buy_property", playerId: player.id };
    if (player.money >= space.price && space.group) {
      const groupIndices = getPropertiesInGroup(state, space.group);
      const owned = groupIndices.filter((i) => state.properties[i]?.ownerId === player.id).length;
      if (owned >= groupIndices.length - 1) return { type: "buy_property", playerId: player.id };
    }
    if (player.money >= space.price && space.price <= player.money * 0.5) {
      return { type: "buy_property", playerId: player.id };
    }
    return { type: "decline_property", playerId: player.id };
  }

  if (state.turnPhase === "post_roll") {
    // Try building
    for (let i = 0; i < BOARD.length; i++) {
      const space = BOARD[i];
      if (space.type !== "property") continue;
      const prop = state.properties[i];
      if (!prop || prop.ownerId !== player.id) continue;
      if (prop.mortgaged || prop.houses >= HOTEL_LEVEL) continue;
      if (!ownsFullGroup(state, player.id, space.group)) continue;

      const isHotel = prop.houses === MAX_HOUSES;
      const cost = isHotel ? COLOR_GROUPS[space.group].hotelCost : COLOR_GROUPS[space.group].houseCost;
      if (player.money >= cost + 3000) {
        const groupIndices = getPropertiesInGroup(state, space.group);
        const minH = Math.min(...groupIndices.map((gi) => state.properties[gi].houses));
        if (prop.houses <= minH) {
          return { type: "build_house", playerId: player.id, spaceIndex: i };
        }
      }
    }

    if (player.money < 0) {
      for (let i = 0; i < BOARD.length; i++) {
        const prop = state.properties[i];
        if (prop && prop.ownerId === player.id && !prop.mortgaged && prop.houses === 0) {
          return { type: "mortgage_property", playerId: player.id, spaceIndex: i };
        }
      }
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
export { BOARD, BOARD_SIZE, COLOR_GROUPS, GO_SALARY, JAIL_POSITION, JAIL_FINE, MAX_HOUSES, HOTEL_LEVEL, STARTING_MONEY, ROLL_TO_START, ownsFullGroup, getPropertiesInGroup, calculateRent };
