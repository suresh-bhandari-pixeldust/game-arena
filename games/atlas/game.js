// Atlas (Word Chain Geography) — Pure Game Engine
// Players take turns naming places; each must start with the last letter of the previous one.

const PLACES = [
  // Countries
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Chad", "Chile", "China",
  "Colombia", "Comoros", "Congo", "Croatia", "Cuba", "Cyprus", "Denmark", "Djibouti", "Dominica",
  "Ecuador", "Egypt", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait",
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Mauritania", "Mauritius", "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco",
  "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "Nicaragua", "Niger",
  "Nigeria", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Paraguay", "Peru", "Philippines",
  "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Samoa", "Senegal", "Serbia",
  "Seychelles", "Singapore", "Slovakia", "Slovenia", "Somalia", "Spain", "Sri Lanka", "Sudan",
  "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand",
  "Togo", "Tonga", "Trinidad", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda",
  "Ukraine", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia",
  "Zimbabwe",
  // Major Cities
  "Abu Dhabi", "Accra", "Addis Ababa", "Adelaide", "Algiers", "Amman", "Amsterdam", "Ankara",
  "Antananarivo", "Ashgabat", "Astana", "Athens", "Atlanta", "Auckland", "Baghdad", "Baku",
  "Bamako", "Bangkok", "Barcelona", "Beijing", "Beirut", "Belfast", "Belgrade", "Berlin",
  "Bern", "Bishkek", "Bogota", "Brasilia", "Bratislava", "Brisbane", "Brussels", "Bucharest",
  "Budapest", "Buenos Aires", "Cairo", "Canberra", "Cape Town", "Caracas", "Casablanca",
  "Chennai", "Chicago", "Colombo", "Copenhagen", "Dakar", "Dallas", "Damascus", "Dar es Salaam",
  "Delhi", "Denver", "Detroit", "Dhaka", "Doha", "Dubai", "Dublin", "Durban", "Dushanbe",
  "Edinburgh", "Florence", "Frankfurt", "Freetown", "Fukuoka", "Geneva", "Guangzhou",
  "Hanoi", "Harare", "Havana", "Helsinki", "Hiroshima", "Hong Kong", "Honolulu", "Houston",
  "Hyderabad", "Islamabad", "Istanbul", "Jakarta", "Jeddah", "Jerusalem", "Johannesburg",
  "Kabul", "Kampala", "Karachi", "Kathmandu", "Khartoum", "Kiev", "Kigali", "Kingston",
  "Kinshasa", "Kolkata", "Kuala Lumpur", "Kuwait City", "Lagos", "Lahore", "Lima", "Lisbon",
  "Ljubljana", "London", "Los Angeles", "Luanda", "Lusaka", "Luxembourg City", "Lyon",
  "Madrid", "Managua", "Manchester", "Manila", "Maputo", "Marseille", "Mecca", "Medina",
  "Melbourne", "Memphis", "Miami", "Milan", "Minneapolis", "Minsk", "Mogadishu", "Monaco",
  "Monterrey", "Montevideo", "Montreal", "Moscow", "Mumbai", "Munich", "Muscat", "Nairobi",
  "Nanjing", "Naples", "Nashville", "Nassau", "Nicosia", "Niamey", "Osaka", "Oslo", "Ottawa",
  "Ouagadougou", "Oxford", "Panama City", "Paris", "Perth", "Philadelphia", "Phnom Penh",
  "Phoenix", "Podgorica", "Port Louis", "Portland", "Porto", "Prague", "Pretoria", "Pristina",
  "Pyongyang", "Quito", "Rabat", "Reykjavik", "Richmond", "Riga", "Rio de Janeiro",
  "Riyadh", "Rome", "Rotterdam", "Salvador", "San Francisco", "San Jose", "Santiago",
  "Santo Domingo", "Sao Paulo", "Sarajevo", "Seattle", "Seoul", "Shanghai", "Shenzhen",
  "Singapore", "Skopje", "Sofia", "Stockholm", "Stuttgart", "Suva", "Sydney", "Taipei",
  "Tallinn", "Tashkent", "Tehran", "Tel Aviv", "Thessaloniki", "Tirana", "Tokyo", "Toronto",
  "Tripoli", "Tunis", "Turin", "Ulaanbaatar", "Valencia", "Vancouver", "Venice", "Vienna",
  "Vientiane", "Vilnius", "Warsaw", "Washington", "Wellington", "Windhoek", "Winnipeg",
  "Wuhan", "Yangon", "Yerevan", "Yokohama", "Zagreb", "Zanzibar", "Zurich",
  // Additional places to boost coverage of difficult letters
  "Osaka", "Orlando", "Ottawa", "Omaha", "Oxford", "Odessa", "Okinawa",
  "Xiamen", "Xian",
  "Yokohama", "Yaounde", "Yazd",
  "Queenstown", "Quetta", "Quebec",
  "Utrecht", "Udon Thani", "Ulsan",
  "Vladivostok", "Valletta", "Vaduz", "Verona", "Varna",
  "Wroclaw", "Wenzhou", "Wollongong",
  "Nagoya", "Nantes", "Nice", "Nuremberg", "Nottingham", "Norwich",
  "Gdansk", "Geneva", "Glasgow", "Gothenburg", "Graz",
  "Hamburg", "Hanover", "Hartford", "Halifax", "Havana",
  "Innsbruck", "Incheon", "Indore",
  "Jaipur", "Juarez",
  "Kobe", "Kyoto", "Krakow", "Katowice",
  "Lhasa", "Lille", "Leeds", "Leipzig", "Lucerne",
  "Malaga", "Malmö", "Manama", "Mombasa", "Montpellier",
  "Portland", "Pune", "Palermo", "Plymouth", "Poznan",
  "Reno", "Rosario", "Recife",
  "Seville", "Strasbourg", "Salzburg", "Samara", "Sapporo",
  "Tbilisi", "Toulouse", "Tampa", "Tangier", "Tianjin",
  "Aberdeen", "Adelaide", "Agra", "Aleppo", "Alexandria",
  "Baltimore", "Bangalore", "Belize City", "Bergen", "Birmingham", "Bordeaux", "Boulder", "Bristol",
  "Calgary", "Charlotte", "Christchurch", "Cincinnati", "Cologne", "Columbus",
  "Darwin", "Donetsk", "Dresden", "Dundee", "Durango",
  "Edmonton", "Eindhoven", "El Paso",
  "Fez", "Freiburg",
];

// Deduplicate and normalize
const PLACE_SET = new Set();
const PLACE_LIST = [];
for (const p of PLACES) {
  const norm = p.trim().toLowerCase();
  if (!PLACE_SET.has(norm)) {
    PLACE_SET.add(norm);
    PLACE_LIST.push(p.trim());
  }
}

// Build lookup by first letter (lowercase)
const PLACES_BY_LETTER = {};
for (const p of PLACE_LIST) {
  const first = p[0].toLowerCase();
  if (!PLACES_BY_LETTER[first]) PLACES_BY_LETTER[first] = [];
  PLACES_BY_LETTER[first].push(p);
}

function isValidPlace(name) {
  return PLACE_SET.has(name.trim().toLowerCase());
}

function getLastLetter(name) {
  const cleaned = name.trim().toLowerCase();
  return cleaned[cleaned.length - 1];
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
    idx = (idx + 1) % total;
    if (!state.players[idx].eliminated) {
      return idx;
    }
  }
  return -1;
}

function checkWinner(state) {
  const alive = state.players.filter((p) => !p.eliminated);
  if (alive.length === 1) {
    state.winnerId = alive[0].id;
    state.phase = "finished";
    pushLog(state, `${alive[0].name} wins the game!`);
    return true;
  }
  if (alive.length === 0) {
    state.phase = "finished";
    pushLog(state, "No players remaining — it's a draw!");
    return true;
  }
  return false;
}

export function createGame({ players, options = {} }) {
  const gamePlayers = players.map((player) => ({
    id: player.id,
    name: player.name,
    isBot: Boolean(player.isBot),
    eliminated: false,
    score: 0,
  }));

  const state = {
    players: gamePlayers,
    currentPlayerIndex: 0,
    phase: "playing", // playing | finished
    winnerId: null,
    usedPlaces: [],       // normalized lowercase names used so far
    lastPlace: null,      // the last valid place submitted
    requiredLetter: null,  // letter the next place must start with (null = first turn, any letter)
    turnTimer: 30,
    timerStartedAt: Date.now(),
    log: [],
    options,
  };

  pushLog(state, `The game begins! ${gamePlayers[0].name} goes first — name any place!`);

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

  if (type === "submit_word") {
    if (state.phase !== "playing") {
      return { state, error: "Game is not in playing phase." };
    }
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      return { state, error: "Not your turn." };
    }
    if (currentPlayer.eliminated) {
      return { state, error: "You have been eliminated." };
    }

    const word = (action.word || "").trim();
    if (!word) {
      return { state, error: "Please enter a place name." };
    }

    const wordLower = word.toLowerCase();

    // Check if it starts with the required letter
    if (state.requiredLetter && wordLower[0] !== state.requiredLetter) {
      return { state, error: `Place must start with the letter "${state.requiredLetter.toUpperCase()}".` };
    }

    // Check if valid place
    if (!isValidPlace(word)) {
      return { state, error: `"${word}" is not a recognized place. Try a different city or country.` };
    }

    // Check if already used
    if (state.usedPlaces.includes(wordLower)) {
      return { state, error: `"${word}" has already been used!` };
    }

    // Valid submission
    state.usedPlaces.push(wordLower);
    // Find the canonical name for display
    const canonical = PLACE_LIST.find((p) => p.toLowerCase() === wordLower) || word;
    state.lastPlace = canonical;
    state.requiredLetter = getLastLetter(canonical);
    currentPlayer.score += 1;

    pushLog(state, `${currentPlayer.name}: ${canonical} (next letter: ${state.requiredLetter.toUpperCase()})`);

    // Move to next alive player
    const nextIdx = nextAlivePlayer(state, state.currentPlayerIndex);
    if (nextIdx < 0 || checkWinner(state)) {
      return { state };
    }

    state.currentPlayerIndex = nextIdx;
    state.timerStartedAt = Date.now();

    return { state };
  }

  if (type === "timeout" || type === "pass") {
    // Player couldn't answer in time or passed — eliminate them
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      return { state, error: "Not your turn." };
    }

    currentPlayer.eliminated = true;
    pushLog(state, `${currentPlayer.name} is eliminated! ${type === "timeout" ? "Time ran out." : "They passed."}`);

    const nextIdx = nextAlivePlayer(state, state.currentPlayerIndex);
    if (nextIdx < 0 || checkWinner(state)) {
      return { state };
    }

    state.currentPlayerIndex = nextIdx;
    state.timerStartedAt = Date.now();

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
      eliminated: player.eliminated,
      score: player.score,
    })),
  };
}

export function getBotMove(state, playerIndex) {
  const player = state.players[playerIndex];
  if (!player || player.eliminated) return null;

  if (state.phase !== "playing" || state.currentPlayerIndex !== playerIndex) {
    return null;
  }

  const letter = state.requiredLetter;
  const candidates = letter
    ? (PLACES_BY_LETTER[letter] || [])
    : PLACE_LIST;

  // Filter out used places
  const available = candidates.filter(
    (p) => !state.usedPlaces.includes(p.toLowerCase())
  );

  if (available.length === 0) {
    // Bot can't find a valid place — pass
    return { type: "pass", playerId: player.id };
  }

  // Pick a random valid place
  const pick = available[Math.floor(Math.random() * available.length)];
  return { type: "submit_word", playerId: player.id, word: pick };
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

export { PLACE_LIST, PLACES_BY_LETTER, isValidPlace, getLastLetter };
